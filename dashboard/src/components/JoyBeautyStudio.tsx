import React, { useEffect, useState } from 'react';
import '../joy-beauty-studio.css';

const services = [
  { id: 'signature', name: 'Signature silk press', detail: 'Cleanse, treatment, precision press and finish', duration: '2 hr', price: '$145' },
  { id: 'protective', name: 'Protective style consultation', detail: 'Scalp review, style plan and preparation guide', duration: '45 min', price: '$55' },
  { id: 'color', name: 'Dimensional color', detail: 'Consultation, custom color, bond care and finish', duration: '3 hr', price: 'From $210' },
];

export const JoyBeautyStudio: React.FC = () => {
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [confirmed, setConfirmed] = useState(false);
  const selected = services.find((service) => service.id === selectedService) ?? services[0];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Joy Beauty Studio | Personal beauty care';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const submitBooking = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmed(true);
  };

  return (
    <main className="joy-site">
      <nav className="joy-nav" aria-label="Joy Beauty Studio navigation">
        <div className="joy-nav-contrast" aria-hidden="true" />
        <a className="joy-brand" href="#top" aria-label="Joy Beauty Studio home">JOY <span>Beauty Studio</span></a>
        <div className="joy-nav-links">
          <a href="#services">Services</a>
          <a href="#booking">Book</a>
        </div>
      </nav>

      <header className="joy-hero" id="top">
        <img src="/joy-beauty-studio-hero.jpg" alt="A beauty professional styling a client's hair in the studio" />
        <div className="joy-hero-shade" />
        <div className="joy-hero-content">
          <p className="joy-kicker">Personal beauty care / New York</p>
          <h1>Good hair days,<br />made personal.</h1>
          <p className="joy-hero-copy">Thoughtful styling, healthy-hair care, and an appointment shaped around you.</p>
          <a className="joy-primary" href="#booking">Book your visit <span aria-hidden="true">→</span></a>
        </div>
      </header>

      <section className="joy-availability" aria-label="Next appointment availability">
        <span className="joy-availability-label">Next openings</span>
        <strong>Thursday 11:30</strong>
        <strong>Friday 2:00</strong>
        <span>Consultations welcome</span>
      </section>

      <section className="joy-services" id="services" aria-labelledby="joy-services-title">
        <div className="joy-section-heading">
          <p className="joy-kicker">The service ledger</p>
          <h2 id="joy-services-title">Choose what you need.<br />We will shape the rest together.</h2>
        </div>
        <div className="joy-service-list">
          {services.map((service) => (
            <button
              className={`joy-service-row ${selectedService === service.id ? 'selected' : ''}`}
              key={service.id}
              type="button"
              onClick={() => { setSelectedService(service.id); setConfirmed(false); }}
              aria-pressed={selectedService === service.id}
            >
              <span className="joy-service-name">{service.name}</span>
              <span className="joy-service-detail">{service.detail}</span>
              <span className="joy-service-meta">{service.duration}</span>
              <strong>{service.price}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="joy-booking-band" id="booking" aria-labelledby="joy-booking-title">
        <div className="joy-booking-intro">
          <p className="joy-kicker">Your appointment</p>
          <h2 id="joy-booking-title">Leave with a plan,<br />not just a look.</h2>
          <p>Every visit starts with a real conversation about your routine, your hair, and how the result needs to live after you leave the chair.</p>
        </div>
        <form className="joy-booking-form" onSubmit={submitBooking}>
          <div className="joy-booking-selection">
            <span>Selected service</span>
            <strong>{selected.name}</strong>
            <span>{selected.duration} · {selected.price}</span>
          </div>
          <label>
            Your name
            <input name="name" required autoComplete="name" placeholder="First and last name" />
          </label>
          <label>
            Email
            <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
          </label>
          <button className="joy-submit" type="submit">Request this appointment <span aria-hidden="true">→</span></button>
          {confirmed && <p className="joy-confirmation" role="status">Request received. Joy Beauty Studio will confirm your time directly.</p>}
        </form>
      </section>

      <footer className="joy-footer">
        <a className="joy-brand" href="#top">JOY <span>Beauty Studio</span></a>
        <p>Personal care. Clear appointments. Beautiful work.</p>
      </footer>
    </main>
  );
};
