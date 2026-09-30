import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { extname, resolve } from 'node:path'
import express, { type Request, type Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import type { RowDataPacket } from 'mysql2'
import type { AccountUser, SimulationRecord } from '../shared/contracts.js'
import { barbers, findScheduleDay, services, slotsByDay } from '../shared/catalog.js'
import { getPool, hasDatabaseConfig } from './db.js'
import { schemaVersion } from './migrations.js'
import { authAttemptLimiter, hashPassword, nameFromEmail, normalizeEmail, validPassword, verifyPassword } from './password-auth.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '12kb', strict: true }))
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Vary', 'Cookie')
  next()
})

const SESSION_COOKIE = 'n13_account_session'
const CSRF_COOKIE = 'n13_auth_csrf'
const NONCE_COOKIE = 'n13_auth_nonce'
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30
const BOOTSTRAP_AGE_SECONDS = 60 * 10
const googleClient = new OAuth2Client()

type InternalUser = AccountUser & { dbId: string }
type UserRow = RowDataPacket & {
  id: number | string
  email: string
  display_name: string
  google_sub?: string | null
  password_hash?: string | null
  created_at: Date | string
}
type HistoryRow = RowDataPacket & {
  id: string
  service_id: string
  service_name: string
  barber_id: string
  barber_name: string
  day_id: string
  day_date: Date | string
  day_label: string
  day_number: string
  start_time: string
  created_at: Date | string
}

function isSecureRequest(req: Request): boolean {
  return req.secure || req.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https' || process.env.NODE_ENV === 'production'
}

function cookieValue(req: Request, name: string): string | undefined {
  const header = req.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() !== name) continue
    try {
      return decodeURIComponent(part.slice(separator + 1).trim())
    } catch {
      return undefined
    }
  }
  return undefined
}

function writeCookie(res: Response, req: Request, name: string, value: string, options: {
  httpOnly: boolean
  maxAge: number
}): void {
  const secure = isSecureRequest(req)
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${options.maxAge}`,
    `SameSite=${secure ? 'None' : 'Lax'}`,
  ]
  if (options.httpOnly) parts.push('HttpOnly')
  if (secure) parts.push('Secure')
  res.append('Set-Cookie', parts.join('; '))
}

function clearCookie(res: Response, req: Request, name: string, httpOnly: boolean): void {
  writeCookie(res, req, name, '', { httpOnly, maxAge: 0 })
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function setPrivateNoStore(res: Response): void {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
}

function unavailable(res: Response): void {
  res.status(503).json({ error: 'A conta não está disponível agora.', code: 'service_unavailable' })
}

function requireCsrf(req: Request, res: Response): boolean {
  const cookieToken = cookieValue(req, CSRF_COOKIE)
  const headerToken = req.get('x-csrf-token')
  const fetchSite = req.get('sec-fetch-site')
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken) || fetchSite === 'cross-site') {
    res.status(403).json({ error: 'Não foi possível validar esta ação. Atualize a página e tente novamente.', code: 'csrf_failed' })
    return false
  }
  return true
}

function dateToIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString()
  const text = String(value)
  return /Z$|[+-]\d\d:\d\d$/.test(text) ? new Date(text).toISOString() : new Date(`${text.replace(' ', 'T')}Z`).toISOString()
}

async function authenticatedUser(req: Request): Promise<InternalUser | null> {
  const token = cookieValue(req, SESSION_COOKIE)
  if (!token || !hasDatabaseConfig()) return null

  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT u.id, u.email, u.display_name, u.created_at
       FROM n13_sessions s JOIN n13_app_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)
      LIMIT 1`,
    [hashToken(token)],
  )
  const row = rows[0]
  if (!row) return null
  return {
    id: String(row.id),
    dbId: String(row.id),
    email: row.email,
    name: row.display_name,
    createdAt: dateToIso(row.created_at),
  }
}

function requireDatabase(res: Response): boolean {
  if (hasDatabaseConfig()) return true
  unavailable(res)
  return false
}

async function createSession(userId: string, req: Request, res: Response): Promise<void> {
  const db = getPool()
  const session = randomToken(32)
  const expiresAt = new Date(Date.now() + SESSION_AGE_SECONDS * 1000).toISOString().replace('T', ' ').replace('Z', '')
  await db.execute('DELETE FROM n13_sessions WHERE expires_at <= UTC_TIMESTAMP(3)')
  await db.execute('INSERT INTO n13_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hashToken(session), userId, expiresAt])
  writeCookie(res, req, SESSION_COOKIE, session, { httpOnly: true, maxAge: SESSION_AGE_SECONDS })
  clearCookie(res, req, NONCE_COOKIE, true)
}

function isDuplicateEmail(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'ER_DUP_ENTRY'
}

function requireUser(user: InternalUser | null, res: Response): user is InternalUser {
  if (user) return true
  res.status(401).json({ error: 'Entre com sua conta Navalha 13 para acessar esta área.', code: 'unauthorized' })
  return false
}

function serialiseHistory(row: HistoryRow): SimulationRecord {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    barberId: row.barber_id,
    barberName: row.barber_name,
    dayId: row.day_id,
    dayDate: row.day_date instanceof Date ? row.day_date.toISOString().slice(0, 10) : String(row.day_date).slice(0, 10),
    dayLabel: row.day_label,
    dayNumber: row.day_number,
    time: row.start_time,
    createdAt: dateToIso(row.created_at),
  }
}

app.get('/_app/health', async (_req, res) => {
  setPrivateNoStore(res)
  if (!hasDatabaseConfig()) {
    res.status(503).json({ ok: false, database: 'not_configured' })
    return
  }
  try {
    const [rows] = await getPool().execute<Array<{ version: number } & RowDataPacket>>(
      'SELECT version FROM n13_schema_migrations WHERE version = ? LIMIT 1',
      [schemaVersion],
    )
    if (!rows.length) {
      res.status(503).json({ ok: false, database: 'migration_required' })
      return
    }
    res.status(200).json({ ok: true })
  } catch {
    res.status(503).json({ ok: false, database: 'unavailable' })
  }
})

app.get('/api/auth/bootstrap', (req, res) => {
  setPrivateNoStore(res)
  const csrfToken = randomToken(24)
  const nonce = randomToken(24)
  writeCookie(res, req, CSRF_COOKIE, csrfToken, { httpOnly: false, maxAge: BOOTSTRAP_AGE_SECONDS })
  writeCookie(res, req, NONCE_COOKIE, nonce, { httpOnly: true, maxAge: BOOTSTRAP_AGE_SECONDS })
  res.json({ csrfToken, nonce })
})

app.get('/api/auth/me', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireDatabase(res)) return
  try {
    const user = await authenticatedUser(req)
    res.json({ user: user ? { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } : null })
  } catch {
    unavailable(res)
  }
})

app.post('/api/auth/register', authAttemptLimiter, async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password
  if (!email || !validPassword(password)) {
    res.status(400).json({ error: 'Informe um e-mail válido e uma senha com pelo menos 12 caracteres (máximo de 128 bytes).', code: 'invalid_registration' })
    return
  }

  try {
    const passwordHash = await hashPassword(password)
    const [result] = await getPool().execute<import('mysql2').ResultSetHeader>(
      'INSERT INTO n13_app_users (google_sub, email, password_hash, display_name) VALUES (NULL, ?, ?, ?)',
      [email, passwordHash, nameFromEmail(email)],
    )
    const userId = String(result.insertId)
    await createSession(userId, req, res)
    const [rows] = await getPool().execute<UserRow[]>(
      'SELECT id, email, display_name, created_at FROM n13_app_users WHERE id = ? LIMIT 1',
      [userId],
    )
    const user = rows[0]
    if (!user) throw new Error('New account was not returned by the database')
    res.status(201).json({ user: { id: String(user.id), email: user.email, name: user.display_name, createdAt: dateToIso(user.created_at) } satisfies AccountUser })
  } catch (error) {
    if (isDuplicateEmail(error)) {
      res.status(409).json({ error: 'Este e-mail já possui uma conta. Entre ou use o acesso Google.', code: 'email_in_use' })
      return
    }
    unavailable(res)
  }
})

app.post('/api/auth/login', authAttemptLimiter, async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password
  if (!email || typeof password !== 'string' || password.length === 0 || Buffer.byteLength(password, 'utf8') > 128) {
    res.status(400).json({ error: 'Informe um e-mail e uma senha válidos.', code: 'invalid_credentials' })
    return
  }

  try {
    const [rows] = await getPool().execute<UserRow[]>(
      'SELECT id, email, display_name, password_hash, created_at FROM n13_app_users WHERE email = ? LIMIT 1',
      [email],
    )
    const user = rows[0]
    const passwordMatches = await verifyPassword(password, user?.password_hash)
    if (!user || !passwordMatches) {
      res.status(401).json({ error: 'E-mail ou senha incorretos. Se criou sua conta com Google, use essa opção.', code: 'invalid_login' })
      return
    }

    const userId = String(user.id)
    await createSession(userId, req, res)
    res.json({ user: { id: userId, email: user.email, name: user.display_name, createdAt: dateToIso(user.created_at) } satisfies AccountUser })
  } catch {
    unavailable(res)
  }
})

app.post('/api/auth/google', authAttemptLimiter, async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID
  const credential = req.body?.credential
  const expectedNonce = cookieValue(req, NONCE_COOKIE)
  if (!clientId) {
    res.status(503).json({ error: 'O login Google ainda não foi configurado.', code: 'google_not_configured' })
    return
  }
  if (typeof credential !== 'string' || credential.length > 10000 || !expectedNonce) {
    res.status(400).json({ error: 'Resposta de login inválida. Tente novamente.', code: 'invalid_credential' })
    return
  }

  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId }).catch(() => null)
  if (!ticket) {
    res.status(401).json({ error: 'Não foi possível verificar esta conta Google. Tente novamente.', code: 'invalid_google_token' })
    return
  }
  const payload = ticket.getPayload()
  const email = normalizeEmail(payload?.email)
  if (!payload?.sub || !email || payload.email_verified !== true || payload.nonce !== expectedNonce) {
    res.status(401).json({ error: 'Não foi possível verificar esta conta Google. Tente novamente.', code: 'invalid_google_token' })
    return
  }

  try {
    const db = getPool()
    const [matches] = await db.execute<UserRow[]>(
      'SELECT id, google_sub, email, display_name, created_at FROM n13_app_users WHERE google_sub = ? OR email = ? LIMIT 2',
      [payload.sub, email],
    )
    const byGoogle = matches.find((row) => row.google_sub === payload.sub)
    const byEmail = matches.find((row) => row.email === email)
    if (byGoogle && byEmail && String(byGoogle.id) !== String(byEmail.id)) {
      res.status(409).json({ error: 'Este e-mail já está associado a outra conta Navalha 13.', code: 'account_link_conflict' })
      return
    }

    let userId: string
    const displayName = String(payload.name || email.split('@')[0]).slice(0, 200)
    if (byGoogle) {
      await db.execute('UPDATE n13_app_users SET email = ?, display_name = ? WHERE id = ?', [email, displayName, byGoogle.id])
      userId = String(byGoogle.id)
    } else if (byEmail) {
      if (byEmail.google_sub && byEmail.google_sub !== payload.sub) {
        res.status(409).json({ error: 'Este e-mail já está associado a outra conta Navalha 13.', code: 'account_link_conflict' })
        return
      }
      await db.execute('UPDATE n13_app_users SET google_sub = ?, display_name = ? WHERE id = ?', [payload.sub, displayName, byEmail.id])
      userId = String(byEmail.id)
    } else {
      const [userResult] = await db.execute<import('mysql2').ResultSetHeader>(
        'INSERT INTO n13_app_users (google_sub, email, display_name) VALUES (?, ?, ?)',
        [payload.sub, email, displayName],
      )
      userId = String(userResult.insertId)
    }

    await createSession(userId, req, res)
    const [rows] = await db.execute<UserRow[]>('SELECT id, email, display_name, created_at FROM n13_app_users WHERE id = ? LIMIT 1', [userId])
    const user = rows[0]
    if (!user) throw new Error('Account upsert did not return a row')
    res.status(200).json({ user: { id: String(user.id), email: user.email, name: user.display_name, createdAt: dateToIso(user.created_at) } satisfies AccountUser })
  } catch {
    unavailable(res)
  }
})

app.post('/api/auth/logout', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res)) return
  const token = cookieValue(req, SESSION_COOKIE)
  clearCookie(res, req, SESSION_COOKIE, true)
  clearCookie(res, req, NONCE_COOKIE, true)
  if (!token) {
    res.json({ ok: true })
    return
  }
  if (!requireDatabase(res)) return
  try {
    await getPool().execute('DELETE FROM n13_sessions WHERE token_hash = ?', [hashToken(token)])
    res.json({ ok: true })
  } catch {
    unavailable(res)
  }
})

app.get('/api/history', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireDatabase(res)) return
  try {
    const user = await authenticatedUser(req)
    if (!requireUser(user, res)) return
    const [rows] = await getPool().execute<HistoryRow[]>(
      `SELECT id, service_id, service_name, barber_id, barber_name, day_id, day_date, day_label, day_number, start_time, created_at
         FROM n13_simulations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [user.dbId],
    )
    res.json({ items: rows.map(serialiseHistory) })
  } catch {
    unavailable(res)
  }
})

app.post('/api/history', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  try {
    const user = await authenticatedUser(req)
    if (!requireUser(user, res)) return
    const { serviceId, barberId, dayId, date, time } = req.body ?? {}
    const service = services.find((item) => item.id === serviceId)
    const barber = barbers.find((item) => item.id === barberId)
    const day = typeof dayId === 'string' && typeof date === 'string' ? findScheduleDay(dayId, date) : undefined
    const slot = typeof dayId === 'string' ? slotsByDay[dayId]?.find((item) => item.time === time && !item.occupied) : undefined
    if (!service || !barber || !day || !slot) {
      res.status(400).json({ error: 'Essa opção demonstrativa expirou. Atualize os horários e tente novamente.', code: 'invalid_simulation' })
      return
    }

    const id = randomUUID()
    await getPool().execute(
      `INSERT INTO n13_simulations
       (id, user_id, service_id, service_name, barber_id, barber_name, day_id, day_date, day_label, day_number, start_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.dbId, service.id, service.name, barber.id, barber.name, day.id, day.date, day.label, day.day, slot.time],
    )
    const item: SimulationRecord = {
      id,
      serviceId: service.id,
      serviceName: service.name,
      barberId: barber.id,
      barberName: barber.name,
      dayId: day.id,
      dayDate: day.date,
      dayLabel: day.label,
      dayNumber: day.day,
      time: slot.time,
      createdAt: new Date().toISOString(),
    }
    res.status(201).json({ item })
  } catch {
    unavailable(res)
  }
})

app.delete('/api/history', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  try {
    const user = await authenticatedUser(req)
    if (!requireUser(user, res)) return
    await getPool().execute('DELETE FROM n13_simulations WHERE user_id = ?', [user.dbId])
    res.json({ ok: true })
  } catch {
    unavailable(res)
  }
})

app.delete('/api/account', async (req, res) => {
  setPrivateNoStore(res)
  if (!requireCsrf(req, res) || !requireDatabase(res)) return
  try {
    const user = await authenticatedUser(req)
    if (!requireUser(user, res)) return
    await getPool().execute('DELETE FROM n13_app_users WHERE id = ?', [user.dbId])
    clearCookie(res, req, SESSION_COOKIE, true)
    clearCookie(res, req, NONCE_COOKIE, true)
    res.json({ ok: true })
  } catch {
    unavailable(res)
  }
})

app.use('/api', (_req, res) => {
  setPrivateNoStore(res)
  res.status(404).json({ error: 'Rota da API não encontrada.', code: 'not_found' })
})

if (process.env.NODE_ENV === 'production') {
  const webRoot = resolve(process.cwd(), 'dist')
  app.use(express.static(webRoot, {
    index: false,
    maxAge: 0,
    setHeaders(res, filePath) {
      if (filePath.startsWith(resolve(webRoot, 'assets') + '/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
      }
    },
  }))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (/^\/(?:api|_app)(?:\/|$)/u.test(req.path) || extname(req.path)) return next()
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    res.sendFile(resolve(webRoot, 'index.html'), (error) => { if (error) next(error) })
  })
}

const port = Number(process.env.PORT || 3001)
app.listen(port, '0.0.0.0', () => {
  console.log(`Navalha API listening on port ${port}`)
})
