import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { AccountUser, AuthBootstrap, SimulationRecord } from '../shared/contracts'
import {
  ApiError,
  clearHistory as clearAccountHistory,
  deleteAccount as deleteAccountRequest,
  exchangeGoogleCredential,
  getAuthBootstrap,
  getCurrentUser,
  getHistory,
  loginWithPassword,
  logout as logoutRequest,
  registerAccount,
  resetAuthBootstrapCache,
} from './api'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
let googleScriptPromise: Promise<void> | null = null
let configuredGoogleHandshake = ''

type AccountMode = 'login' | 'register'

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-n13-google-identity]')
    const script = existing ?? document.createElement('script')
    const loaded = () => window.google?.accounts?.id ? resolve() : reject(new Error('A biblioteca do Google não ficou disponível.'))
    const failed = () => reject(new Error('Não foi possível carregar o login Google. Verifique sua conexão.'))
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', failed, { once: true })
    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.n13GoogleIdentity = 'true'
      document.head.appendChild(script)
    }
  }).catch((error: unknown) => {
    googleScriptPromise = null
    throw error
  })
  return googleScriptPromise!
}

function formatDate(record: SimulationRecord): string {
  const date = new Date(`${record.dayDate}T12:00:00-03:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'N13'
}

function safeBookingReturn(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname !== '/agendar') return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function AccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingReturn = safeBookingReturn(searchParams.get('redirect'))
  const [bootstrap, setBootstrap] = useState<AuthBootstrap | null>(null)
  const [user, setUser] = useState<AccountUser | null>(null)
  const [history, setHistory] = useState<SimulationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const [mode, setMode] = useState<AccountMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const buttonRef = useRef<HTMLDivElement>(null)
  const credentialHandlerRef = useRef<(credential: string) => void>(() => undefined)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const challenge = await getAuthBootstrap()
        if (!active) return
        setBootstrap(challenge)
        const current = await getCurrentUser()
        if (!active) return
        setUser(current.user)
        if (current.user && bookingReturn) {
          navigate(bookingReturn, { replace: true })
          return
        }
        if (current.user) {
          const result = await getHistory()
          if (active) setHistory(result.items)
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar a conta.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [bookingReturn, navigate])

  useEffect(() => {
    if (!bootstrap || user) return
    const timer = window.setInterval(() => {
      resetAuthBootstrapCache()
      void getAuthBootstrap().then((freshChallenge) => setBootstrap(freshChallenge)).catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível renovar a proteção da conta.')
      })
    }, 7 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [bootstrap, user])

  const finishSignIn = async (signedInUser: AccountUser, message: string) => {
    setUser(signedInUser)
    setPassword('')
    setConfirmPassword('')
    setError('')
    setNotice(message)
    try {
      const result = await getHistory()
      setHistory(result.items)
    } catch (historyError) {
      setHistory([])
      setError(historyError instanceof Error ? historyError.message : 'Sua conta entrou, mas o histórico não carregou.')
    }
    if (bookingReturn) navigate(bookingReturn, { replace: true })
  }

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não são iguais. Confira os dois campos.')
      return
    }
    if (mode === 'register' && [...password].length < 12) {
      setError('Crie uma senha com pelo menos 12 caracteres.')
      return
    }
    setBusy(true)
    try {
      const signedInUser = mode === 'register'
        ? await registerAccount(normalizedEmail, password)
        : await loginWithPassword(normalizedEmail, password)
      await finishSignIn(signedInUser, mode === 'register' ? 'Conta criada. Suas próximas simulações ficam no seu histórico.' : 'Você entrou. Confira seu histórico de simulações.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível acessar sua conta.')
    } finally {
      setBusy(false)
    }
  }

  credentialHandlerRef.current = (credential: string) => {
    void (async () => {
      setError('')
      setNotice('')
      setBusy(true)
      try {
        const signedInUser = await exchangeGoogleCredential(credential)
        await finishSignIn(signedInUser, 'Conta Google conectada. As simulações aparecem no seu histórico.')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível concluir o login Google.')
      } finally {
        setBusy(false)
      }
    })()
  }

  useEffect(() => {
    if (!bootstrap || !googleClientId || user || !buttonRef.current) return
    let active = true
    void loadGoogleIdentity().then(() => {
      if (!active || !buttonRef.current || !window.google?.accounts?.id) return
      const handshakeKey = `${googleClientId}:${bootstrap.nonce}`
      if (configuredGoogleHandshake !== handshakeKey) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          nonce: bootstrap.nonce,
          callback: (response) => {
            if (response.credential) credentialHandlerRef.current(response.credential)
          },
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
        })
        configuredGoogleHandshake = handshakeKey
      }
      buttonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: Math.min(360, Math.max(250, Math.floor(buttonRef.current.clientWidth || 320))),
        locale: 'pt-BR',
      })
      setGoogleReady(true)
    }).catch((scriptError: unknown) => {
      if (active) setError(scriptError instanceof Error ? scriptError.message : 'Não foi possível carregar o login Google.')
    })
    return () => { active = false }
  }, [bootstrap, user])

  const signOut = async () => {
    setError('')
    setNotice('')
    setBusy(true)
    let serverResponded = false
    try {
      await logoutRequest()
      serverResponded = true
      setNotice('Você saiu da sua conta Navalha 13.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível sair da conta.')
      serverResponded = requestError instanceof ApiError && requestError.status > 0
    } finally {
      setBusy(false)
    }
    if (serverResponded) {
      window.google?.accounts.id.disableAutoSelect()
      setUser(null)
      setHistory([])
      resetAuthBootstrapCache()
      window.location.reload()
    }
  }

  const clearHistory = async () => {
    if (!window.confirm('Apagar todas as simulações salvas no histórico? Esta ação não pode ser desfeita.')) return
    setBusy(true)
    setError('')
    try {
      await clearAccountHistory()
      setHistory([])
      setNotice('Histórico apagado desta conta.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível apagar o histórico.')
    } finally {
      setBusy(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Apagar permanentemente sua conta Navalha 13 e todo o histórico de simulações? Esta ação não pode ser desfeita.')) return
    setBusy(true)
    setError('')
    try {
      await deleteAccountRequest()
      setUser(null)
      setHistory([])
      resetAuthBootstrapCache()
      window.location.reload()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível apagar a conta.')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (nextMode: AccountMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
    setPassword('')
    setConfirmPassword('')
  }

  return <div className="inner-page account-page">
    <section className="page-hero container account-page-hero" data-reveal>
      <p className="eyebrow">08 — Sua conta · Navalha 13</p>
      <h1>Seu ritual.<br /><em>Seu histórico.</em></h1>
      <p>Entre ou crie sua conta para guardar as simulações de horários. Nenhum horário vira reserva de verdade.</p>
    </section>
    <section className="container account-layout">
      <aside className="account-intro" data-reveal>
        <span className="account-seal" aria-hidden="true">N13</span>
        <p className="eyebrow">Atendimento demonstrativo</p>
        <h2>Uma conta<br /><em>sem enrolação.</em></h2>
        <p>Sua conta é da própria Navalha 13, não do Manus. Use e-mail e senha; o histórico guarda escolhas demonstrativas, nunca uma reserva real.</p>
        <div className="account-privacy-note"><span aria-hidden="true">✦</span><p>Senhas são protegidas no servidor e nunca armazenadas em texto puro. Use uma senha exclusiva para este site.</p></div>
      </aside>

      <section className="account-card" aria-labelledby="account-card-title" data-reveal>
        <div className="account-card-top"><span>MINHA CONTA / 13</span><span className="account-online"><i /> {user ? 'CONECTADA' : loading ? 'CARREGANDO' : 'ACESSO DO SITE'}</span></div>
        {loading ? <div className="account-loading" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><span>Carregando sua conta...</span><span className="account-shimmer" /></div> : user ? <>
          <div className="account-profile"><span className="account-avatar" aria-hidden="true">{initials(user.name)}</span><div><p className="eyebrow">Bem-vindo de volta</p><h2 id="account-card-title">{user.name}</h2><p>{user.email}</p></div></div>
          <div className="history-heading"><div><p className="eyebrow">Arquivo da cadeira</p><h3>Histórico <span>({history.length})</span></h3></div>{history.length > 0 && <button className="text-button account-text-button" type="button" onClick={() => void clearHistory()} disabled={busy}>Apagar histórico</button>}</div>
          {history.length ? <ol className="history-list">{history.map((record, index) => <li className="history-item" key={record.id}><span className="history-number">{String(index + 1).padStart(2, '0')}</span><div className="history-item-main"><strong>{record.serviceName}</strong><span>{record.barberName} · {formatDate(record)} · {record.time}</span></div><span className="simulation-badge">SIMULAÇÃO</span></li>)}</ol> : <div className="history-empty"><span aria-hidden="true">✂</span><h3>Sua cadeira ainda está vazia.</h3><p>Quando você concluir uma simulação conectado, ela aparecerá aqui.</p><Link className="button button-primary" to="/agendar">Fazer uma simulação</Link></div>}
          <div className="account-actions"><button className="button button-ghost" type="button" onClick={() => void signOut()} disabled={busy}>Sair da conta</button><button className="account-delete" type="button" onClick={() => void deleteAccount()} disabled={busy}>Apagar conta e histórico</button></div>
        </> : <>
          <div className="account-signin">
            <p className="eyebrow">Acesso seguro</p>
            <h2 id="account-card-title">{mode === 'login' ? 'Entre na sua conta.' : 'Crie sua conta.'}</h2>
            {bookingReturn && <p className="account-redirect-note">Depois de entrar, você volta para a agenda escolhida.</p>}
            <div className="account-mode-switch" role="group" aria-label="Entrar ou criar conta">
              <button type="button" aria-pressed={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>Entrar</button>
              <button type="button" aria-pressed={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>Criar conta</button>
            </div>
            <form className="account-auth-form" onSubmit={submitCredentials}>
              <label>E-mail<input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@exemplo.com" maxLength={254} required /></label>
              <label>Senha<input type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : 1} maxLength={128} required /></label>
              {mode === 'register' && <label>Confirme sua senha<input type="password" name="confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required /></label>}
              {mode === 'register' && <p className="account-form-note">Use pelo menos 12 caracteres. Nesta versão não há confirmação de e-mail.</p>}
              <button className="button button-primary button-full" type="submit" disabled={busy} aria-busy={busy}>{busy ? <><span className="loading-spinner" aria-hidden="true" /> Aguarde...</> : mode === 'login' ? 'Entrar com e-mail e senha' : 'Criar minha conta'}</button>
            </form>
            <p className="account-form-note">A recuperação de senha por e-mail ainda não está disponível. Use uma senha exclusiva e guarde-a com segurança.</p>
            <div className="account-auth-divider"><span>ou, se preferir</span></div>
            {googleClientId ? <div className="google-signin-area"><div className="google-signin-button" ref={buttonRef} aria-label="Entrar com Google" />{!googleReady && <span className="google-button-loading"><span className="loading-spinner" /> Preparando Google...</span>}</div> : <div className="google-config-notice" role="status"><strong>Google é opcional</strong><span>Ainda depende da configuração protegida do proprietário; e-mail e senha são a opção principal.</span></div>}
            <p className="account-security-footnote">Não existe login Manus nesta conta. O Google, quando habilitado, usa o botão oficial e nunca recebe sua senha deste site.</p>
          </div>
        </>}
        {(error || notice) && <p className={error ? 'account-message is-error' : 'account-message'} role={error ? 'alert' : 'status'}>{error || notice}</p>}
        <p className="account-disclaimer">Histórico de demonstração — não é uma reserva, compra ou atendimento real.</p>
      </section>
    </section>
  </div>
}
