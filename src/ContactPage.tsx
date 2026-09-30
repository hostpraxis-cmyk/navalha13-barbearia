import { Link } from 'react-router-dom'
import { shopContact } from './data'
import { ArrowIcon } from './pages'

export function ContactPage() {
  return <div className="inner-page">
    <section className="page-hero container" data-reveal>
      <p className="eyebrow">06 — Navalha 13 Barbearia</p>
      <h1>Chega mais.<br /><em>Na demonstração.</em></h1>
      <p>Localização, horário e contato de exemplo. Todos os dados abaixo são fictícios e não correspondem a uma loja ou telefone reais.</p>
    </section>
    <section className="container contact-page-layout inner-section">
      <div className="contact-map" role="img" aria-label="Mapa ilustrativo, sem coordenadas reais, da fictícia Vila do Corte">
        <span className="map-road map-road-horizontal" aria-hidden="true" />
        <span className="map-road map-road-diagonal" aria-hidden="true" />
        <span className="map-road map-road-vertical" aria-hidden="true" />
        <span className="map-block map-block-one" aria-hidden="true" />
        <span className="map-block map-block-two" aria-hidden="true" />
        <span className="map-block map-block-three" aria-hidden="true" />
        <span className="map-neighborhood">VILA DO CORTE</span>
        <span className="map-street">RUA DA NAVALHA</span>
        <div className="map-pin"><span>13</span></div>
        <div className="map-label"><strong>{shopContact.address}</strong><span>LOCAL FICTÍCIO · SEM GPS</span></div>
        <span className="map-stamp">MAPA<br />DEMO</span>
      </div>
      <div className="contact-details" data-reveal>
        <p className="eyebrow">A casa · como chegar</p>
        <h2>Um lugar<br /><em>de mentira.</em></h2>
        <p className="contact-intro">Criamos este endereço para deixar a experiência completa. A Navalha 13 é uma barbearia demonstrativa: não vá até este local.</p>
        <dl className="contact-facts">
          <div><dt>Endereço fictício</dt><dd>{shopContact.address}<span>{shopContact.neighborhood}</span></dd></div>
          <div><dt>Telefone demonstrativo</dt><dd>{shopContact.phone}<span>Número inventado · não recebe ligações</span></dd></div>
          <div><dt>Horário ilustrativo</dt><dd>{shopContact.days}<span>{shopContact.hours}</span></dd></div>
        </dl>
        <p className="demo-note">Nenhum endereço real, atendimento ou canal de contato é representado nesta página.</p>
        <Link className="button button-primary" to="/agendar">Simular um horário <ArrowIcon /></Link>
      </div>
    </section>
  </div>
}
