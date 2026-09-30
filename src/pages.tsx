import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { barbers, images, scheduleDays, services, slotsByDay } from './data'
import { ApiError, createSimulation, getCurrentUser } from './api'

type BookAction = (serviceId?: string) => void

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /><i /></span>
}

export function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-arrow"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-check"><path d="m5 12.6 4.2 4.1L19.4 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function StarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-star"><path d="m12 3 2.6 5.4 6 .9-4.3 4.2 1 5.9-5.3-2.9-5.3 2.9 1-5.9L3.4 9.3l6-.9L12 3Z" fill="currentColor" /></svg>
}

function BarberPole() {
  return <div className="barber-pole" aria-hidden="true"><span className="pole-cap" /><span className="pole-glass"><i /></span><span className="pole-cap" /></div>
}

function Ticker() {
  return <div className="barber-ticker" aria-label="Corte clássico, barba na régua e navalha tradicional"><div className="ticker-track" aria-hidden="true">{[0, 1].map((copy) => <span className="ticker-group" key={copy}><b>CORTE CLÁSSICO</b><i>✦</i><b>BARBA NA RÉGUA</b><i>✦</i><b>NAVALHA TRADICIONAL</b><i>✦</i><b>CAFÉ PASSADO NA HORA</b><i>✦</i></span>)}</div></div>
}

function PageIntro({ number, title, accent, copy }: { number: string; title: string; accent: string; copy: string }) {
  return <section className="page-hero container" data-reveal><p className="eyebrow">{number} — Navalha 13 Barbearia</p><h1>{title}<br /><em>{accent}</em></h1><p>{copy}</p></section>
}

export function HomePage() {
  return <>
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" /><div className="hero-image-wrap"><img src={images.hero} alt="Barbeiro fazendo acabamento na barba de um cliente" className="hero-image" /></div>
      <div className="hero-content container"><p className="eyebrow entrance">Barbearia clássica · corte · barba</p><h1 id="hero-title" className="entrance delay-1">Corte afiado.<br /><span>Barba na régua.</span></h1><p className="hero-copy entrance delay-2">Corte bem feito, barba na régua e aquele tempo de cadeira que faz diferença. Chega mais.</p><div className="hero-actions entrance delay-3"><Link className="button button-primary" to="/agendar">Simular meu horário <ArrowIcon /></Link><Link className="button button-ghost" to="/servicos">Ver serviços</Link></div><div className="hero-trust entrance delay-4"><div className="rating-pill"><StarIcon /><strong>4.9</strong><span>em 380 rituais</span></div><div className="hero-rule" /><p>Ter — Sáb<br /><strong>09h às 20h</strong></p></div></div>
      <div className="hero-stamp" aria-label="Navalha 13 desde 2013"><span>desde</span><strong>2013</strong><span>ritual urbano</span></div><div className="hero-pole-wrap"><BarberPole /><span>BARBEARIA<br />DESDE 2013</span></div><a className="scroll-cue" href="#destaques" aria-label="Conhecer a barbearia"><span /> conhecer</a>
    </section>
    <Ticker />
    <section className="home-services section container" id="destaques"><div className="section-heading split-heading" data-reveal><div><p className="eyebrow">Escolha seu corte</p><h2>Clássico na<br /><em>medida certa.</em></h2></div><p>Do corte na tesoura ao desenho da barba. Serviço bem feito, sem pressa e sem complicação.</p></div><div className="services-grid">{services.map((service) => <article className="service-card" key={service.id} data-reveal><span className="service-index">{service.index}</span><div><h3>{service.name}</h3><p>{service.description}</p></div><div className="service-footer"><span>{service.duration}</span><strong>{service.price}</strong></div><Link to={`/agendar?servico=${service.id}`}>Agendar <ArrowIcon /></Link></article>)}</div><div className="home-more"><Link className="text-link" to="/servicos">Conhecer todos os serviços <ArrowIcon /></Link></div></section>
    <section className="experience home-experience"><div className="container experience-grid"><div className="experience-image image-frame" data-reveal><img src={images.beard} alt="Barbeiro desenhando a barba com navalha" loading="lazy" /><div className="image-note"><span>BARBA</span><strong>13</strong></div></div><div className="experience-copy" data-reveal><p className="eyebrow">A casa</p><h2>Cadeira de couro.<br /><em>Mão de barbeiro.</em></h2><p className="lead">Espelho grande, toalha quente, navalha afiada e conversa sem pressa. Aqui, cada cliente sai alinhado.</p><Link to="/sobre" className="text-link">Conhecer a Navalha 13 <ArrowIcon /></Link></div></div></section>
    <section className="home-last container" data-reveal><div><p className="eyebrow">Seu próximo corte começa aqui</p><h2>Achou seu<br /><em>barbeiro?</em></h2></div><div><p>Veja quem faz parte da equipe e escolha o horário da sua simulação.</p><div className="hero-actions"><Link className="button button-ghost" to="/barbeiros">Conhecer barbeiros</Link><Link className="button button-primary" to="/agendar">Agendar agora <ArrowIcon /></Link></div><span className="demo-note">Demonstração: sem reserva real ou pagamento.</span></div></section>
  </>
}

export function ServicesPage({ onBook }: { onBook: BookAction }) {
  return <div className="inner-page"><PageIntro number="01" title="Serviço de barbeiro." accent="Sem enrolação." copy="Escolha o cuidado que combina com você. Valores e duração são demonstrativos." /><section className="container inner-section"><div className="services-grid">{services.map((service) => <article className="service-card" key={service.id} data-reveal><span className="service-index">{service.index}</span><div><h3>{service.name}</h3><p>{service.description}</p></div><div className="service-footer"><span>{service.duration}</span><strong>{service.price}</strong></div><button className="service-action" type="button" onClick={() => onBook(service.id)}>Escolher horário <ArrowIcon /></button></article>)}</div><p className="demo-note">Cardápio demonstrativo. Nenhum serviço foi comprado.</p></section></div>
}

export function BarbersPage({ onBook }: { onBook: BookAction }) {
  return <div className="inner-page"><PageIntro number="02" title="Mão firme." accent="Boa conversa." copy="Conheça os profissionais da Navalha 13 e encontre o estilo de corte que combina com você. Perfis e imagens demonstrativos para esta barbearia fictícia." /><section className="container inner-section"><div className="team-grid">{barbers.map((barber, index) => <article className="barber-profile" key={barber.id} data-reveal><div className={`barber-portrait ${barber.tone}`}><img src={barber.photo} alt="" aria-hidden="true" loading="lazy" /><span className="portrait-number">0{index + 1} / NAVALHA 13</span><strong>{barber.initials}</strong><span className="portrait-stroke" /></div><div className="barber-profile-copy"><p className="eyebrow">Barbeiro especialista</p><h2>{barber.name}</h2><p>{barber.specialty}. Técnica no detalhe, conversa boa e respeito ao seu estilo.</p><button className="text-link text-button" type="button" onClick={() => onBook()}>Agendar com a equipe <ArrowIcon /></button></div></article>)}</div><div className="team-note" data-reveal><span>✂</span><p>Não sabe por onde começar? Conte o que procura na agenda e a equipe demonstrativa ajuda você a escolher.</p><Link className="button button-primary" to="/agendar">Escolher um horário <ArrowIcon /></Link></div></section></div>
}

export function GalleryPage() {
  return <div className="inner-page"><PageIntro number="03" title="Da cadeira." accent="Pro espelho." copy="Um pouco das ferramentas, do cuidado e do espaço da Navalha 13." /><section className="container inner-section"><div className="gallery-grid gallery-page-grid"><figure className="gallery-card gallery-tools" data-reveal><img src={images.tools} alt="Navalha e ferramentas de barbearia sobre a bancada" /><figcaption>Ferramenta boa. Mão firme.</figcaption></figure><figure className="gallery-card gallery-interior" data-reveal><img src={images.interior} alt="Interior escuro e elegante da barbearia com cadeira de couro" /><figcaption>Uma cadeira esperando por você.</figcaption></figure><figure className="gallery-card gallery-beard" data-reveal><img src={images.beard} alt="Detalhe de uma barba sendo desenhada" /><figcaption>Acabamento na régua.</figcaption></figure><figure className="gallery-card gallery-hero" data-reveal><img src={images.hero} alt="Barbeiro trabalhando no corte de um cliente" /><figcaption>O corte acontece nos detalhes.</figcaption></figure></div><p className="demo-note">Imagens de demonstração da experiência da barbearia.</p></section></div>
}

export function AboutPage() {
  return <div className="inner-page"><PageIntro number="04" title="A barbearia." accent="Do seu jeito." copy="A Navalha 13 junta a tradição de barbearia com corte atual, sem tirar o tempo de conversar." /><section className="container inner-section about-layout"><div className="about-photo image-frame" data-reveal><img src={images.interior} alt="Cadeira de barbeiro e ambiente do salão" /><div className="image-note"><span>NA CASA</span><strong>13</strong></div></div><div className="about-copy" data-reveal><p className="eyebrow">O ritual da casa</p><h2>Madeira, couro<br /><em>e navalha.</em></h2><p>Chegue, escolha sua cadeira e conte como quer sair. A ideia é simples: bons profissionais, ferramentas afiadas, toalha quente e um corte feito com atenção.</p><div className="about-facts"><div><strong>Ter — Sáb</strong><span>09h às 20h · horário demonstrativo</span></div><div><strong>Onde estamos</strong><span>Endereço demonstrativo · São Paulo, SP</span></div><div><strong>Contato</strong><span>O formulário não envia mensagem real.</span></div></div><Link className="button button-primary" to="/agendar">Simular um horário <ArrowIcon /></Link></div></section><section className="container about-quote" data-reveal><p>“O bom corte não precisa gritar. Só precisa cair bem.”</p><span>— JEITO NAVALHA 13</span></section></div>
}

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const serviceFromLink = services.some((service) => service.id === searchParams.get('servico')) ? searchParams.get('servico') ?? '' : ''
  const [booking, setBooking] = useState({ serviceId: serviceFromLink, barberId: '', dayId: scheduleDays[0]?.id ?? 'ter', time: '', name: '', whatsapp: '' })
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [localOnlyNote, setLocalOnlyNote] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    setBooking((current) => current.serviceId === serviceFromLink ? current : { ...current, serviceId: serviceFromLink, time: '' })
    setConfirmation('')
    setMessage('')
  }, [serviceFromLink])
  useEffect(() => {
    setLoadingSlots(true)
    const timer = window.setTimeout(() => setLoadingSlots(false), 720)
    return () => window.clearTimeout(timer)
  }, [booking.serviceId, booking.barberId, booking.dayId])
  const selectedService = services.find((service) => service.id === booking.serviceId)
  const selectedBarber = barbers.find((barber) => barber.id === booking.barberId)
  const selectedDay = scheduleDays.find((day) => day.id === booking.dayId)
  const phoneDigits = booking.whatsapp.replace(/\D/g, '')
  const completedSteps = [booking.serviceId, booking.barberId, booking.time, booking.name.trim().length >= 2 && phoneDigits.length >= 10].filter(Boolean).length
  const update = (field: keyof typeof booking, value: string) => { setBooking((current) => ({ ...current, [field]: value })); setMessage('') }
  const selectDay = (dayId: string) => { setBooking((current) => ({ ...current, dayId, time: '' })); setMessage('') }
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (loadingSlots) return setMessage('Aguarde o carregamento dos horários demonstrativos.')
    if (!booking.serviceId || !booking.barberId || !booking.dayId || !booking.time) return setMessage('Escolha serviço, barbeiro, data e horário antes de confirmar.')
    if (booking.name.trim().length < 2) return setMessage('Informe seu nome para continuar.')
    if (phoneDigits.length < 10) return setMessage('Informe um WhatsApp válido com DDD.')
    if (!selectedDay) return setMessage('Atualize a página para carregar os próximos dias demonstrativos.')
    setMessage('')
    setLocalOnlyNote('')
    setSubmitting(true)
    try {
      const current = await getCurrentUser()
      if (current.user) {
        const record = await createSimulation({
          serviceId: booking.serviceId,
          barberId: booking.barberId,
          dayId: selectedDay.id,
          date: selectedDay.date,
          time: booking.time,
        })
        setConfirmation(`N13-${record.id.slice(0, 6).toUpperCase()}`)
        setSavedToHistory(true)
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 950))
        setConfirmation(`N13-${Math.floor(1000 + Math.random() * 9000)}-${booking.dayId.toUpperCase()}`)
        setSavedToHistory(false)
      }
    } catch (submitError) {
      if (submitError instanceof ApiError && (submitError.status === 0 || submitError.status === 503)) {
        setLocalOnlyNote('O serviço da conta está indisponível; esta simulação ficará somente nesta tela e não será salva no histórico.')
        await new Promise((resolve) => window.setTimeout(resolve, 950))
        setConfirmation(`N13-${Math.floor(1000 + Math.random() * 9000)}-${booking.dayId.toUpperCase()}`)
        setSavedToHistory(false)
      } else {
        setMessage(submitError instanceof Error ? submitError.message : 'Não foi possível concluir a simulação. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }
  const restart = () => { setBooking({ serviceId: '', barberId: '', dayId: scheduleDays[0]?.id ?? 'ter', time: '', name: '', whatsapp: '' }); setConfirmation(''); setSavedToHistory(false); setLocalOnlyNote(''); setMessage(''); setSubmitting(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="inner-page"><PageIntro number="05" title="Seu horário." accent="Sem compromisso." copy="Escolha o serviço, o barbeiro e um horário para concluir a demonstração. Nenhum pagamento ou reserva real será feito." /><section className="booking-section booking-page-section"><div className="booking-bg" aria-hidden="true"><span>N13</span></div><div className="container booking-layout"><div className="booking-intro" data-reveal><p className="eyebrow">Agenda demonstrativa</p><h2>Marque o<br /><em>seu corte.</em></h2><p>São quatro passos simples. Os horários, equipe e preços desta agenda são fictícios.</p><div className="booking-disclaimer"><span><CheckIcon /></span> Nenhum pagamento ou cobrança será feito.</div><div className="booking-progress" aria-label={`${completedSteps} de 4 etapas concluídas`}><div className="progress-line"><i style={{ width: `${(completedSteps / 4) * 25}%` }} /></div><span>{completedSteps}/4 etapas</span></div></div>
    <div className="booking-panel" data-reveal>
      {confirmation ? (
        <div className="confirmation" role="status" aria-live="polite">
          <div className="confirmation-icon"><CheckIcon /></div>
          <p className="eyebrow">Simulação concluída</p>
          <h3>Seu corte, no papel.</h3>
          <p className="confirmation-copy">{savedToHistory ? `A simulação ficou salva no histórico da sua conta, ${booking.name.trim().split(' ')[0]}. Nenhum horário foi reservado de verdade.` : `Tudo certo, ${booking.name.trim().split(' ')[0]}. Esta escolha ficou apenas nesta demonstração e não foi enviada nem salva.`}</p>
          <div className="protocol"><span>PROTOCOLO DEMO</span><strong>{confirmation}</strong></div>
          <dl className="confirmation-details">
            <div><dt>Serviço</dt><dd>{selectedService?.name}</dd></div>
            <div><dt>Barbeiro</dt><dd>{selectedBarber?.name}</dd></div>
            <div><dt>Horário demonstrativo</dt><dd>{selectedDay?.label} · {booking.time}</dd></div>
          </dl>
          <p className={localOnlyNote ? 'demo-note booking-local-warning' : 'demo-note'}>{localOnlyNote || 'Não é uma reserva real. Nenhum pagamento ou contato foi feito.'}</p>
          {savedToHistory ? <Link className="button button-ghost button-full" to="/conta">Ver meu histórico <ArrowIcon /></Link> : <Link className="button button-ghost button-full" to="/conta">Entrar com Google e salvar próximas simulações <ArrowIcon /></Link>}
          <button className="button button-primary button-full" type="button" onClick={restart}>Simular outro horário <ArrowIcon /></button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
      <div className="booking-panel-top"><span>AGENDA / DEMO</span><span>ETAPAS 01 — 04</span></div>
      <fieldset className="booking-step"><legend><span>01</span> Escolha seu serviço</legend><div className="choice-grid service-choice-grid">{services.map((service) => <button className={`choice-card ${booking.serviceId === service.id ? 'is-selected' : ''}`} type="button" key={service.id} onClick={() => update('serviceId', service.id)} aria-pressed={booking.serviceId === service.id}><strong>{service.name}</strong><span>{service.duration}</span><em>{service.price}</em></button>)}</div></fieldset>
      <fieldset className="booking-step"><legend><span>02</span> Escolha o barbeiro</legend><div className="barber-list">{barbers.map((barber) => <button className={`barber-card ${booking.barberId === barber.id ? 'is-selected' : ''}`} type="button" key={barber.id} onClick={() => update('barberId', barber.id)} aria-pressed={booking.barberId === barber.id}><span className={`barber-avatar ${barber.tone}`}>{barber.initials}</span><span><strong>{barber.name}</strong><em>{barber.specialty}</em></span><i>{booking.barberId === barber.id ? <CheckIcon /> : '+'}</i></button>)}</div></fieldset>
      <fieldset className="booking-step"><legend><span>03</span> Escolha o dia e horário</legend><div className="day-list" aria-label="Escolher data">{scheduleDays.map((day) => <button className={`day-card ${booking.dayId === day.id ? 'is-selected' : ''}`} type="button" key={day.id} onClick={() => selectDay(day.id)} aria-pressed={booking.dayId === day.id}><span>{day.week}</span><strong>{day.day}</strong><em>{day.label}</em></button>)}</div><div className="time-meta"><span>Disponibilidade demonstrativa</span><span><i className="time-key available" /> livre <i className="time-key busy" /> ocupado</span></div><div className="time-grid" aria-busy={loadingSlots}>{loadingSlots ? <div className="slot-loading" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><span className="slot-loading-copy"><strong>Carregando horários...</strong><small>Conferindo a agenda demonstrativa para {selectedDay?.label.toLowerCase()}.</small></span><span className="loading-line" aria-hidden="true" /></div> : slotsByDay[booking.dayId].map((slot) => <button className={`time-slot ${booking.time === slot.time ? 'is-selected' : ''} ${slot.occupied ? 'is-occupied' : ''}`} type="button" key={slot.time} disabled={slot.occupied} onClick={() => update('time', slot.time)} aria-pressed={booking.time === slot.time}>{slot.time}</button>)}</div></fieldset>
      <fieldset className="booking-step contact-step"><legend><span>04</span> Seus dados demonstrativos</legend><div className="contact-grid"><label>Seu nome<input type="text" value={booking.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex.: Rafael Martins" autoComplete="name" /></label><label>Seu WhatsApp<input type="tel" value={booking.whatsapp} onChange={(event) => update('whatsapp', formatPhone(event.target.value))} placeholder="(11) 99999-9999" autoComplete="tel" inputMode="numeric" /></label></div></fieldset>
      <p className="booking-data-note">Seu nome e WhatsApp ficam só nesta tela. Não são enviados nem salvos no servidor.</p>
      <div className="booking-summary" aria-live="polite"><div><span>Serviço</span><strong>{selectedService?.name ?? 'Escolha um serviço'}</strong></div><div><span>Quando</span><strong>{booking.time ? `${selectedDay?.label} · ${booking.time}` : 'Selecione dia e horário'}</strong></div><span className="summary-price">{selectedService?.price ?? '—'}</span></div>
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="button button-primary button-full" type="submit" disabled={submitting || loadingSlots} aria-busy={submitting}>{submitting ? <><span className="loading-spinner" aria-hidden="true" /> Salvando sua simulação...</> : <>Concluir simulação <ArrowIcon /></>}</button>
      {submitting && <p className="booking-submit-status" role="status" aria-live="polite">Carregando a confirmação demonstrativa. Nenhum horário real será reservado.</p>}
      <p className="form-hint">Sem cobrança, pagamento, mensagem, contato ou reserva real.</p>
        </form>
      )}
    </div></div></section></div>
}

export function PrivacyPage({ onManageCookies }: { onManageCookies: () => void }) {
  return <div className="inner-page"><PageIntro number="09" title="Privacidade." accent="Você escolhe." copy="Veja como cookies, login e histórico funcionam nesta demonstração." /><section className="container privacy-content">
    <article data-reveal><h2>Cookies necessários</h2><p>Um cookie próprio lembra sua escolha de consentimento. Ao entrar com Google, a Navalha 13 também cria uma sessão segura para manter sua conta conectada; ela é HttpOnly e não guarda sua senha Google.</p></article>
    <article data-reveal><h2>Login Google</h2><p>O botão oficial do Google é carregado somente nesta página de conta. O servidor valida o token de identidade; o site recebe apenas dados básicos do perfil necessários à conta. A Navalha 13 não pede nem recebe sua senha.</p></article>
    <article data-reveal><h2>Seu histórico</h2><p>Depois de entrar, as escolhas de serviço, barbeiro, dia e horário podem ficar salvas na sua conta como simulações. Não são reservas reais. Nome e WhatsApp digitados na agenda permanecem no navegador e não são salvos. Você pode apagar seu histórico ou toda a conta na página Minha conta.</p><Link className="text-link" to="/conta">Ir para Minha conta <ArrowIcon /></Link></article>
    <article data-reveal><h2>Cookies opcionais</h2><p>Você pode aceitar ou rejeitar a categoria opcional de analytics. Esta demonstração não instala analytics nem rastreadores de anúncios; sua escolha fica salva apenas para respeitar a preferência.</p></article>
    <article data-reveal><h2>Como mudar sua escolha</h2><p>Reabra as preferências a qualquer momento pelo botão abaixo. Para remover informações da conta, use os controles de exclusão da própria página Minha conta.</p><button className="button button-primary" type="button" onClick={onManageCookies}>Configurar cookies <ArrowIcon /></button></article>
    <p className="demo-note">Navalha 13 é um projeto demonstrativo. Loja, contatos, profissionais, valores, horários e simulações são fictícios; não há pagamentos nem atendimentos reais.</p>
  </section></div>
}
