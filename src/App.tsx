import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AboutPage, ArrowIcon, BarbersPage, BookingPage, BrandMark, GalleryPage, HomePage, PrivacyPage, ServicesPage } from './pages'

type CookieConsent = { analytics: boolean }

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Início | Navalha 13 Barbearia', description: 'Barbearia clássica, corte, barba e agenda demonstrativa da Navalha 13.' },
  '/servicos': { title: 'Serviços | Navalha 13 Barbearia', description: 'Conheça os serviços demonstrativos de corte, barba e combo da Navalha 13.' },
  '/barbeiros': { title: 'Barbeiros | Navalha 13 Barbearia', description: 'Conheça a equipe e as especialidades demonstrativas da Navalha 13.' },
  '/galeria': { title: 'Galeria | Navalha 13 Barbearia', description: 'Veja imagens da barbearia, dos cortes, da barba e das ferramentas.' },
  '/sobre': { title: 'Sobre | Navalha 13 Barbearia', description: 'Conheça a experiência e a casa demonstrativa da Navalha 13.' },
  '/agendar': { title: 'Agendar | Navalha 13 Barbearia', description: 'Simule um horário de corte ou barba. Sem pagamento ou reserva real.' },
  '/privacidade': { title: 'Privacidade e cookies | Navalha 13', description: 'Entenda o consentimento de cookies desta demonstração e altere suas preferências.' },
}

function readConsent(): CookieConsent | null {
  const entry = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('n13_cookie_consent='))
  if (!entry) return null
  return { analytics: entry.split('=').slice(1).join('=').split('&').includes('analytics=1') }
}

function writeConsent(consent: CookieConsent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `n13_cookie_consent=necessary=1&analytics=${consent.analytics ? '1' : '0'}; Max-Age=15552000; Path=/; SameSite=Lax${secure}`
}

function useScrollReveal(pathname: string) {
  useEffect(() => {
    const root = document.documentElement
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    root.classList.add('reveal-ready')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return () => root.classList.remove('reveal-ready')
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); currentObserver.unobserve(entry.target) }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -44px 0px' })
    targets.forEach((target) => observer.observe(target))
    return () => { observer.disconnect(); root.classList.remove('reveal-ready') }
  }, [pathname])
}

function RouteEffects() {
  const { pathname } = useLocation()
  useScrollReveal(pathname)
  useEffect(() => {
    const metadata = pageTitles[pathname] ?? { title: 'Página não encontrada | Navalha 13', description: 'Página não encontrada na Navalha 13.' }
    document.title = metadata.title
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description) }
    description.content = metadata.description
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

const navigation = [
  { to: '/', label: 'Início', end: true },
  { to: '/servicos', label: 'Serviços' },
  { to: '/barbeiros', label: 'Barbeiros' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/sobre', label: 'A casa' },
]

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className="site-header"><Link className="brand" to="/" aria-label="Navalha 13 - início"><BrandMark /><span><strong>NAVALHA</strong><em>13</em></span></Link><button className="menu-toggle" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((current) => !current)}><span /><span /><span /></button><nav id="main-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Páginas do site">{navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'is-active' : ''}>{item.label}</NavLink>)}</nav><NavLink className={({ isActive }) => isActive ? 'header-cta is-active' : 'header-cta'} to="/agendar" onClick={() => setMenuOpen(false)}>Agendar <ArrowIcon /></NavLink></header>
}

function SiteFooter({ onManageCookies }: { onManageCookies: () => void }) {
  return <footer className="site-footer container"><Link className="brand footer-brand" to="/"><BrandMark /><span><strong>NAVALHA</strong><em>13</em></span></Link><p>© 2026 Navalha 13. Barbearia demonstrativa.</p><div className="footer-links"><Link to="/privacidade">Privacidade e cookies</Link><button type="button" onClick={onManageCookies}>Configurar cookies</button><Link to="/agendar">Ver agenda</Link></div></footer>
}

function CookieNotice({ forceOpen, onClose }: { forceOpen: boolean; onClose: () => void }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readConsent())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const openSettings = () => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setAnalytics(readConsent()?.analytics ?? false)
    setSettingsOpen(true)
  }
  const closeSettings = () => { setSettingsOpen(false); onClose() }
  useEffect(() => { if (forceOpen) openSettings() }, [forceOpen])
  useEffect(() => {
    if (!settingsOpen) return
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])') ?? []).filter((item) => !item.hasAttribute('disabled'))
    focusable()[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeSettings(); return }
      if (event.key !== 'Tab' || !dialog) return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus.current?.isConnected) previousFocus.current.focus()
      else document.querySelector<HTMLElement>('.header-cta')?.focus()
    }
  }, [settingsOpen])
  const save = (allowAnalytics: boolean) => {
    const choice = { analytics: allowAnalytics }
    writeConsent(choice)
    setConsent(choice)
    setSettingsOpen(false)
    onClose()
  }
  return <>
    {!consent && <aside className="cookie-banner" role="region" aria-label="Preferências de cookies"><div className="cookie-banner-copy"><p className="eyebrow">Sua privacidade</p><h2>Cookies, do seu jeito.</h2><p>Usamos um cookie necessário para lembrar sua escolha. Nenhum rastreador de terceiros está ativo.</p><Link to="/privacidade">Ler sobre cookies</Link></div><div className="cookie-actions"><button className="button button-ghost" type="button" onClick={() => save(false)}>Só necessários</button><button className="button button-primary" type="button" onClick={() => save(true)}>Aceitar opcionais</button><button className="cookie-preferences" type="button" onClick={() => { setAnalytics(readConsent()?.analytics ?? false); setSettingsOpen(true) }}>Personalizar</button></div></aside>}
    {settingsOpen && <div className="cookie-backdrop" role="presentation"><section className="cookie-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cookie-title" tabIndex={-1}><button className="cookie-close" type="button" aria-label="Fechar preferências" onClick={closeSettings}>×</button><p className="eyebrow">Preferências do navegador</p><h2 id="cookie-title">Escolha seus cookies.</h2><p>Esta demonstração salva a escolha em um cookie próprio. Não há ferramentas de analytics nem rastreadores de terceiros instalados.</p><div className="cookie-option"><div><strong>Necessários</strong><span>Essenciais para salvar sua preferência. Sempre ativos.</span></div><span className="cookie-always-on">Sempre ativos</span></div><label className="cookie-option cookie-toggle"><span><strong>Analytics opcionais</strong><span>Preferência registrada, sem serviço de terceiros nesta demonstração.</span></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label><div className="cookie-dialog-actions"><button className="button button-ghost" type="button" onClick={() => save(false)}>Rejeitar opcionais</button><button className="button button-primary" type="button" onClick={() => save(analytics)}>Salvar escolhas</button></div></section></div>}
  </>
}

function AppRoutes({ onManageCookies }: { onManageCookies: () => void }) {
  const navigate = useNavigate()
  const book = (serviceId?: string) => navigate(serviceId ? `/agendar?servico=${encodeURIComponent(serviceId)}` : '/agendar')
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/servicos" element={<ServicesPage onBook={book} />} /><Route path="/barbeiros" element={<BarbersPage onBook={book} />} /><Route path="/galeria" element={<GalleryPage />} /><Route path="/sobre" element={<AboutPage />} /><Route path="/agendar" element={<BookingPage />} /><Route path="/privacidade" element={<PrivacyPage onManageCookies={onManageCookies} />} /><Route path="*" element={<main className="container not-found"><p className="eyebrow">404 — página não encontrada</p><h1>Esta cadeira<br /><em>está vazia.</em></h1><Link className="button button-primary" to="/">Voltar ao início <ArrowIcon /></Link></main>} /></Routes>
}

function AppContent() {
  const [manageCookies, setManageCookies] = useState(false)
  return <div className="site-shell"><RouteEffects /><SiteHeader /><AppRoutes onManageCookies={() => setManageCookies(true)} /><SiteFooter onManageCookies={() => setManageCookies(true)} /><CookieNotice forceOpen={manageCookies} onClose={() => setManageCookies(false)} /></div>
}

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><AppContent /></BrowserRouter>
}
