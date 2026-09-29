import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { barbers, images, scheduleDays, services, slotsByDay, testimonials } from './data'

type BookingState = {
  serviceId: string
  barberId: string
  dayId: string
  time: string
  name: string
  whatsapp: string
}

const initialBooking: BookingState = {
  serviceId: '',
  barberId: '',
  dayId: 'ter',
  time: '',
  name: '',
  whatsapp: '',
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <i />
    </span>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-arrow">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-check">
      <path d="m5 12.6 4.2 4.1L19.4 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-star">
      <path d="m12 3 2.6 5.4 6 .9-4.3 4.2 1 5.9-5.3-2.9-5.3 2.9 1-5.9L3.4 9.3l6-.9L12 3Z" fill="currentColor" />
    </svg>
  )
}

export default function App() {
  const [booking, setBooking] = useState<BookingState>(initialBooking)
  const [formMessage, setFormMessage] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')

  const selectedService = useMemo(
    () => services.find((service) => service.id === booking.serviceId),
    [booking.serviceId],
  )
  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === booking.barberId),
    [booking.barberId],
  )
  const selectedDay = useMemo(
    () => scheduleDays.find((day) => day.id === booking.dayId),
    [booking.dayId],
  )

  const completedSteps = [booking.serviceId, booking.barberId, booking.time, booking.name && booking.whatsapp].filter(Boolean).length
  const bookingReady = Boolean(booking.serviceId && booking.barberId && booking.dayId && booking.time)

  const setBookingField = <K extends keyof BookingState>(field: K, value: BookingState[K]) => {
    setBooking((current) => ({ ...current, [field]: value }))
    setFormMessage('')
  }

  const selectDay = (dayId: string) => {
    setBooking((current) => ({ ...current, dayId, time: '' }))
    setFormMessage('')
  }

  const phoneDigits = booking.whatsapp.replace(/\D/g, '')

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    return digits
  }

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!bookingReady) {
      setFormMessage('Escolha serviço, profissional, data e horário antes de confirmar.')
      return
    }
    if (booking.name.trim().length < 2) {
      setFormMessage('Informe seu nome para continuar.')
      return
    }
    if (phoneDigits.length < 10) {
      setFormMessage('Informe um WhatsApp válido com DDD.')
      return
    }

    const protocol = `N13-${Math.floor(1000 + Math.random() * 9000)}-${booking.dayId.toUpperCase()}`
    setConfirmationCode(protocol)
    setFormMessage('')
  }

  const restartBooking = () => {
    setBooking(initialBooking)
    setConfirmationCode('')
    setFormMessage('')
    window.setTimeout(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.querySelector('#agendamento')?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    }, 50)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Navalha 13 - início">
          <BrandMark />
          <span>
            <strong>NAVALHA</strong>
            <em>13</em>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#experiencia">A casa</a>
          <a href="#galeria">Galeria</a>
        </nav>
        <a className="header-cta" href="#agendamento">
          Agendar <ArrowIcon />
        </a>
      </header>

      <main>
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-image-wrap">
            <img src={images.hero} alt="Barbeiro refinando a barba de um cliente" className="hero-image" />
          </div>
          <div className="hero-content container">
            <p className="eyebrow entrance">Barbearia · corte · presença</p>
            <h1 id="hero-title" className="entrance delay-1">
              Seu horário.<br />
              <span>Seu ritual.</span>
            </h1>
            <p className="hero-copy entrance delay-2">Precisão de navalha, pausa de verdade e um visual que acompanha o seu ritmo.</p>
            <div className="hero-actions entrance delay-3">
              <a className="button button-primary" href="#agendamento">Reservar meu horário <ArrowIcon /></a>
              <a className="button button-ghost" href="#servicos">Conhecer a casa</a>
            </div>
            <div className="hero-trust entrance delay-4">
              <div className="rating-pill"><StarIcon /><strong>4.9</strong><span>em 380 rituais</span></div>
              <div className="hero-rule" />
              <p>Ter — Sáb<br /><strong>09h às 20h</strong></p>
            </div>
          </div>
          <div className="hero-stamp" aria-label="Navalha 13 desde 2013">
            <span>desde</span><strong>2013</strong><span>ritual urbano</span>
          </div>
          <a className="scroll-cue" href="#servicos" aria-label="Descer até os serviços"><span /> rolar</a>
        </section>

        <section className="services section container" id="servicos" aria-labelledby="services-title">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">01 — O seu tempo</p>
              <h2 id="services-title">Ritual na<br /><em>medida certa.</em></h2>
            </div>
            <p>Do desenho da barba ao último toque do acabamento, cada serviço tem ritmo, técnica e espaço para você chegar no resultado certo.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.id}>
                <span className="service-index">{service.index}</span>
                <div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="service-footer">
                  <span>{service.duration}</span>
                  <strong>{service.price}</strong>
                </div>
                <a href="#agendamento" onClick={() => setBookingField('serviceId', service.id)} aria-label={`Escolher ${service.name}`}>Escolher <ArrowIcon /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="experience" id="experiencia" aria-labelledby="experience-title">
          <div className="container experience-grid">
            <div className="experience-image image-frame">
              <img src={images.beard} alt="Detalhe de barba sendo desenhada com navalha" loading="lazy" />
              <div className="image-note"><span>HANDS ON</span><strong>01/13</strong></div>
            </div>
            <div className="experience-copy">
              <p className="eyebrow">02 — A casa</p>
              <h2 id="experience-title">Menos pressa.<br /><em>Mais presença.</em></h2>
              <p className="lead">A Navalha 13 nasceu para fazer do cuidado pessoal uma pausa bem vivida. Madeira, couro, conversa boa e técnica que aparece no detalhe.</p>
              <div className="experience-points">
                <div><strong>45</strong><span>minutos de atenção real</span></div>
                <div><strong>03</strong><span>profissionais especialistas</span></div>
                <div><strong>01</strong><span>cadeira com o seu nome</span></div>
              </div>
              <a href="#agendamento" className="text-link">Encontrar meu horário <ArrowIcon /></a>
            </div>
          </div>
        </section>

        <section className="gallery section" id="galeria" aria-labelledby="gallery-title">
          <div className="container">
            <div className="section-heading gallery-heading">
              <div>
                <p className="eyebrow">03 — Dentro do ritual</p>
                <h2 id="gallery-title">A técnica mora<br /><em>nos detalhes.</em></h2>
              </div>
              <span className="gallery-counter">01 <i /> 03</span>
            </div>
            <div className="gallery-grid">
              <figure className="gallery-card gallery-tools"><img src={images.tools} alt="Navalha, tesoura e itens de grooming sobre bancada" loading="lazy" /><figcaption>Ferramentas que contam histórias.</figcaption></figure>
              <figure className="gallery-card gallery-interior"><img src={images.interior} alt="Cadeira de couro em um ambiente de barbearia escuro e elegante" loading="lazy" /><figcaption>A pausa começa quando você entra.</figcaption></figure>
              <div className="gallery-quote"><span>“</span><p>Não é só o que você vê no espelho. É como você sai pela porta.</p><strong>— NAVALHA 13</strong></div>
            </div>
          </div>
        </section>

        <section className="testimonials section container" aria-labelledby="testimonials-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">04 — Quem senta, volta</p>
              <h2 id="testimonials-title">Presença que<br /><em>fica.</em></h2>
            </div>
            <div className="testimonial-score"><span>Nota média</span><strong>4.9 <StarIcon /></strong></div>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <article className="testimonial-card" key={testimonial.name}>
                <span className="testimonial-index">0{index + 1}</span>
                <div className="stars" aria-label={`${testimonial.rating} estrelas`}><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <footer><strong>{testimonial.name}</strong><span>{testimonial.detail}</span></footer>
              </article>
            ))}
          </div>
        </section>

        <section className="booking-section" id="agendamento" aria-labelledby="booking-title">
          <div className="booking-bg" aria-hidden="true"><span>N13</span></div>
          <div className="container booking-layout">
            <div className="booking-intro">
              <p className="eyebrow">05 — Seu horário</p>
              <h2 id="booking-title">Marque o<br /><em>seu ritual.</em></h2>
              <p>Escolha cada detalhe no seu ritmo. Leva menos de um minuto e é tudo uma <strong>simulação demonstrativa</strong>.</p>
              <div className="booking-disclaimer"><span><CheckIcon /></span> Nenhum pagamento ou cobrança será feito.</div>
              <div className="booking-progress" aria-label={`${completedSteps} de 4 etapas concluídas`}>
                <div className="progress-line"><i style={{ width: `${(completedSteps / 4) * 100}%` }} /></div>
                <span>{completedSteps}/4 etapas</span>
              </div>
            </div>

            <div className="booking-panel">
              {confirmationCode ? (
                <div className="confirmation" role="status" aria-live="polite">
                  <div className="confirmation-icon"><CheckIcon /></div>
                  <p className="eyebrow">Horário separado</p>
                  <h3>Ritual confirmado.</h3>
                  <p className="confirmation-copy">Tudo certo, {booking.name.trim().split(' ')[0]}. Guardamos este horário na nossa agenda demonstrativa.</p>
                  <div className="protocol"><span>PROTOCOLO</span><strong>{confirmationCode}</strong></div>
                  <dl className="confirmation-details">
                    <div><dt>Serviço</dt><dd>{selectedService?.name}</dd></div>
                    <div><dt>Profissional</dt><dd>{selectedBarber?.name}</dd></div>
                    <div><dt>Horário</dt><dd>{selectedDay?.label} · {booking.time}</dd></div>
                  </dl>
                  <p className="demo-note">Demonstração concluída. Nenhuma reserva real foi criada.</p>
                  <button className="button button-primary button-full" type="button" onClick={restartBooking}>Agendar outro horário <ArrowIcon /></button>
                </div>
              ) : (
                <form onSubmit={submitBooking} noValidate>
                  <div className="booking-panel-top"><span>AGENDA / DEMO</span><span>etapas 01 — 04</span></div>

                  <fieldset className="booking-step">
                    <legend><span>01</span> Escolha seu ritual</legend>
                    <div className="choice-grid service-choice-grid">
                      {services.map((service) => (
                        <button className={`choice-card ${booking.serviceId === service.id ? 'is-selected' : ''}`} type="button" key={service.id} onClick={() => setBookingField('serviceId', service.id)} aria-pressed={booking.serviceId === service.id}>
                          <strong>{service.name}</strong><span>{service.duration}</span><em>{service.price}</em>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="booking-step">
                    <legend><span>02</span> Com quem você senta</legend>
                    <div className="barber-list">
                      {barbers.map((barber) => (
                        <button className={`barber-card ${booking.barberId === barber.id ? 'is-selected' : ''}`} type="button" key={barber.id} onClick={() => setBookingField('barberId', barber.id)} aria-pressed={booking.barberId === barber.id}>
                          <span className={`barber-avatar ${barber.tone}`}>{barber.initials}</span>
                          <span><strong>{barber.name}</strong><em>{barber.specialty}</em></span>
                          <i>{booking.barberId === barber.id ? <CheckIcon /> : '+'}</i>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="booking-step">
                    <legend><span>03</span> Quando o seu tempo abre</legend>
                    <div className="day-list" aria-label="Escolher data">
                      {scheduleDays.map((day) => (
                        <button className={`day-card ${booking.dayId === day.id ? 'is-selected' : ''}`} type="button" key={day.id} onClick={() => selectDay(day.id)} aria-pressed={booking.dayId === day.id}>
                          <span>{day.week}</span><strong>{day.day}</strong><em>{day.label}</em>
                        </button>
                      ))}
                    </div>
                    <div className="time-meta"><span>Horários disponíveis</span><span><i className="time-key available" /> livre <i className="time-key busy" /> ocupado</span></div>
                    <div className="time-grid">
                      {slotsByDay[booking.dayId].map((slot) => (
                        <button className={`time-slot ${booking.time === slot.time ? 'is-selected' : ''} ${slot.occupied ? 'is-occupied' : ''}`} type="button" key={slot.time} disabled={slot.occupied} onClick={() => setBookingField('time', slot.time)} aria-pressed={booking.time === slot.time}>
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="booking-step contact-step">
                    <legend><span>04</span> Quem vamos receber</legend>
                    <div className="contact-grid">
                      <label>Seu nome<input type="text" value={booking.name} onChange={(event) => setBookingField('name', event.target.value)} placeholder="Ex.: Rafael Martins" autoComplete="name" /></label>
                      <label>Seu WhatsApp<input type="tel" value={booking.whatsapp} onChange={(event) => setBookingField('whatsapp', formatPhone(event.target.value))} placeholder="(11) 99999-9999" autoComplete="tel" inputMode="numeric" /></label>
                    </div>
                  </fieldset>

                  <div className="booking-summary" aria-live="polite">
                    <div><span>Seu ritual</span><strong>{selectedService?.name ?? 'Escolha um serviço'}</strong></div>
                    <div><span>Quando</span><strong>{booking.time ? `${selectedDay?.label} · ${booking.time}` : 'Selecione data e horário'}</strong></div>
                    <span className="summary-price">{selectedService?.price ?? '—'}</span>
                  </div>
                  {formMessage && <p className="form-message" role="alert">{formMessage}</p>}
                  <button className="button button-primary button-full" type="submit">Confirmar horário demonstrativo <ArrowIcon /></button>
                  <p className="form-hint">Ao confirmar, você verá apenas uma simulação. Não existe pagamento, cobrança ou reserva real.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <a className="brand footer-brand" href="#inicio"><BrandMark /><span><strong>NAVALHA</strong><em>13</em></span></a>
        <p>© 2026 Navalha 13. Feito para quem faz questão do detalhe.</p>
        <a href="#agendamento" className="text-link">Voltar para agenda <ArrowIcon /></a>
      </footer>
    </div>
  )
}
