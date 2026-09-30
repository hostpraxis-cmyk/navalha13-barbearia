import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import rateLimit from 'express-rate-limit'

const KEY_BYTES = 64
const SALT_BYTES = 16
const COST = 1 << 15
const BLOCK_SIZE = 8
const PARALLELISM = 1
const MAX_MEMORY = 64 * 1024 * 1024
const DUMMY_SALT = Buffer.alloc(SALT_BYTES, 0x4e)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u

type ScryptOptions = { N: number; r: number; p: number; maxmem: number }

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const options: ScryptOptions = { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: MAX_MEMORY }
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_BYTES, options, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !emailPattern.test(email)) return null
  return email
}

export function validPassword(value: unknown): value is string {
  return typeof value === 'string'
    && [...value].length >= 12
    && Buffer.byteLength(value, 'utf8') <= 128
    && !/[\u0000-\u001f\u007f]/u.test(value)
}

export function nameFromEmail(email: string): string {
  const local = email.split('@', 1)[0] ?? ''
  const readable = local.replace(/[._+-]+/gu, ' ').replace(/\s+/gu, ' ').trim()
  return (readable || 'Cliente Navalha').slice(0, 200)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await deriveKey(password, salt)
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELISM}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, encodedHash: unknown): Promise<boolean> {
  if (typeof encodedHash !== 'string') {
    await deriveKey(password, DUMMY_SALT)
    return false
  }

  const parts = encodedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt' || parts[1] !== String(COST) || parts[2] !== String(BLOCK_SIZE) || parts[3] !== String(PARALLELISM)) {
    await deriveKey(password, DUMMY_SALT)
    return false
  }

  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(parts[4], 'base64url')
    expected = Buffer.from(parts[5], 'base64url')
  } catch {
    await deriveKey(password, DUMMY_SALT)
    return false
  }
  if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) {
    await deriveKey(password, DUMMY_SALT)
    return false
  }
  const actual = await deriveKey(password, salt)
  return timingSafeEqual(actual, expected)
}

export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.', code: 'rate_limited' },
})
