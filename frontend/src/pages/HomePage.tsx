
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

import burgerImage from "../assets/burger.jpg";
import tableImage from "../assets/table.png";

const restaurant = {
  name: "Le Pants",
  subtitle: "Craft Burger House",
  telephone: "+358961285000",
  telephoneLabel: "+358 9 6128 5000",
  email: "pants@contact.com",
  address: "Pohjoisesplanadi 17, 00170 Helsinki, Finland",
};

function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="homepage" id="top">

      {/* ACCESSIBILITY */}
      <a className="homepage__skip-link" href="#main-content">
        Skip to content
      </a>

      {/* NAVIGATION */}
      <header className="homepage__header">
        <nav className="homepage__nav" aria-label="Main navigation">

          <div className="homepage__brand-area">
            <button
              className="homepage__icon-button homepage__menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-controls="homepage-mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>

            <Link
              to="/"
              className="homepage__brand"
              onClick={closeMenu}
            >
              <span className="homepage__brand-name">
                {restaurant.name}
              </span>
              <span className="homepage__brand-subtitle">
                {restaurant.subtitle}
              </span>
            </Link>
          </div>

          <div className="homepage__desktop-links">
            <a href="#signature">Our signature</a>
            <a href="#opening-hours">Opening hours</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="homepage__nav-actions">
            <a
              className="homepage__icon-button homepage__call-link"
              href={`tel:${restaurant.telephone}`}
              aria-label="Call the restaurant"
            >
              <Icon name="call" />
            </a>

            <Link
              className="homepage__reserve-link"
              to="/reserve"
            >
              <Icon name="calendar_month" />
              <span>Reserve</span>
            </Link>

            <Link
              to="/login"
              className="homepage__icon-button homepage__login-link"
              aria-label="Staff sign in"
            >
              <Icon name="person_outline" />
            </Link>
          </div>
        </nav>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div
            id="homepage-mobile-menu"
            className="homepage__mobile-menu"
          >
            <a href="#signature" onClick={closeMenu}>
              Our signature
            </a>
            <a href="#opening-hours" onClick={closeMenu}>
              Opening hours
            </a>
            <a href="#contact" onClick={closeMenu}>
              Contact
            </a>
            <Link to="/login" onClick={closeMenu}>
              Staff sign in
            </Link>
          </div>
        )}
      </header>

      <main id="main-content">

        {/* HERO SECTION */}
        <section
          className="homepage__hero"
          aria-labelledby="homepage-hero-title"
        >
          <img
            className="homepage__hero-image"
            src={tableImage}
            alt="Le Pants restaurant dining table"
          />

          <div className="homepage__hero-overlay" />

          <div className="homepage__hero-content">
            <p className="homepage__eyebrow homepage__hero-location">
              Pohjoisesplanadi, Helsinki
            </p>

            <h1 id="homepage-hero-title">
              Artisanal Smash Burgers &amp; Craft Drinks
            </h1>
          </div>
        </section>

        {/* SIGNATURE BURGER */}
        <section
          className="homepage__signature"
          id="signature"
          aria-labelledby="homepage-signature-title"
        >
          <div className="homepage__signature-copy">

            <div className="homepage__signature-heading">
              <div>
                <p className="homepage__eyebrow">
                  The signature burger
                </p>

                <h2 id="homepage-signature-title">
                  Le Pants Double Smash Royale
                </h2>
              </div>

              <span className="homepage__price-tag">
                COURSE 04 · €34
              </span>
            </div>

            <p className="homepage__description">
              Double dry-aged wagyu beef patties seared on
              screaming iron, cloaked in house-smoked
              gruyère and aged sharp cheddar fondue,
              artisanal dill spears, and caramelized onion
              emulsion crowned inside a gilded brioche bun.
            </p>

            <Link
              className="homepage__primary-cta homepage__signature-cta"
              to="/reserve"
            >
              <Icon name="calendar_month" />
              <span>Reserve a Table</span>
            </Link>
          </div>

          {/* BURGER IMAGE */}
          <figure className="homepage__signature-figure">
            <img
              src={burgerImage}
              alt="Le Pants double smash burger with melted cheese"
              loading="lazy"
            />

            <figcaption className="homepage__ingredient-tags">
              <span>Dry-aged wagyu</span>
              <span>House brioche</span>
              <span>Smoked gruyère</span>
            </figcaption>
          </figure>
        </section>

        {/* RESTAURANT DETAILS */}
        <section
          className="homepage__details"
          aria-label="Restaurant details"
        >

          {/* CONTACT */}
          <div className="homepage__contact-cta" id="contact">
            <div>
              <p className="homepage__eyebrow">
                Direct reservations &amp; inquiries
              </p>

              <a
                className="homepage__telephone"
                href={`tel:${restaurant.telephone}`}
              >
                {restaurant.telephoneLabel}
              </a>
            </div>

            <a
              className="homepage__round-call"
              href={`tel:${restaurant.telephone}`}
              aria-label="Call Le Pants"
            >
              <Icon name="call" />
            </a>
          </div>

          <div className="homepage__detail-grid">

            {/* OPENING HOURS */}
            <section
              className="homepage__detail-card"
              id="opening-hours"
              aria-labelledby="homepage-hours-title"
            >
              <h2
                id="homepage-hours-title"
                className="homepage__detail-label"
              >
                <Icon name="schedule" />
                Opening hours
              </h2>

              <dl className="homepage__hours">
                <div>
                  <dt>Monday – Friday</dt>
                  <dd>10:00 – 17:00</dd>
                </div>

                <div>
                  <dt>Saturday</dt>
                  <dd>11:00 – 17:00</dd>
                </div>

                <div>
                  <dt>Sunday</dt>
                  <dd className="homepage__closed">
                    Closed
                  </dd>
                </div>
              </dl>
            </section>

            {/* LOCATION */}
            <section
              className="homepage__detail-card"
              aria-labelledby="homepage-location-title"
            >
              <h2
                id="homepage-location-title"
                className="homepage__detail-label"
              >
                <Icon name="location_on" />
                Location &amp; inquiries
              </h2>

              <address className="homepage__address">
                <strong>
                  Le Pants Craft Burger House Helsinki
                </strong>

                <span>{restaurant.address}</span>
              </address>

              <div className="homepage__email-row">
                <span>Email</span>

                <a href={`mailto:${restaurant.email}`}>
                  <Icon name="mail" />
                  {restaurant.email}
                </a>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="homepage__footer">
            <Link to="/" className="homepage__footer-logo">
              Le Pants
            </Link>

            <p>
              Pohjoisesplanadi 17, 00170 Helsinki
              {" · "}Craft Burger House{" · "}©{" "}
              {new Date().getFullYear()} Le Pants
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
