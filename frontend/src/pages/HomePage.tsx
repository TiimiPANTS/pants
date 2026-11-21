import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatHour, hoursOn, openingHours } from "../utils/openingHours";
import "../styles/HomePage.css";
import { useAuth } from "../hooks/useAuth";

import LePantsLogo from "../assets/LePantsLogo.svg";
import burgerImage from "../assets/burger.jpg";
import interiorImage from "../assets/interior.png";
import winePourImage from "../assets/wine-pour.png";
import brownieImage from "../assets/brownie.png";

const restaurant = {
  name: "Le Pants",
  telephone: "+358961285000",
  telephoneLabel: "+358 9 6128 5000",
  email: "pants@contact.com",
  street: "Pohjoisesplanadi 17",
  city: "00170 Helsinki",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Pohjoisesplanadi+17,+00170+Helsinki",
};

// Placeholder menu — edit names, descriptions and prices here.
const menu = [
  {
    title: "Burgers",
    items: [
      {
        name: "Le Pants Double Smash",
        description: "Dry-aged beef, smoked gruyère, aged cheddar, pickles, onions",
        price: "19",
      },
      {
        name: "Classic Smash",
        description: "Single patty, American cheese, pickles, house sauce",
        price: "14",
      },
      {
        name: "Truffle & Mushroom",
        description: "Beef patty, roasted mushrooms, truffle mayo, comté",
        price: "18",
      },
      {
        name: "Crispy Chicken",
        description: "Buttermilk-fried thigh, slaw, chili honey",
        price: "16",
      },
      {
        name: "Garden Smash",
        description: "Plant-based patty, vegan cheddar, pickles, tomato",
        price: "15",
      },
    ],
  },
  {
    title: "Sides",
    items: [
      {
        name: "Fries",
        description: "Twice-cooked, sea salt",
        price: "5",
      },
      {
        name: "Parmesan Truffle Fries",
        description: "Grated parmesan, truffle oil, chives",
        price: "8",
      },
      {
        name: "Onion Rings",
        description: "Beer batter, smoked aioli",
        price: "6",
      },
      {
        name: "Little Gem Salad",
        description: "Buttermilk dressing, herbs, toasted seeds",
        price: "8",
      },
    ],
  },
  {
    title: "To finish",
    items: [
      {
        name: "Chocolate Milkshake",
        description: "Whipped cream, chocolate drizzle, cocoa dust",
        price: "7",
      },
      {
        name: "Dark Chocolate Brownie",
        description: "Warm, with vanilla ice cream and a cherry",
        price: "9",
      },
    ],
  },
  {
    title: "By the glass",
    items: [
      {
        name: "House Red",
        description: "Ask for tonight's bottle",
        price: "10",
      },
      {
        name: "House White",
        description: "Ask for tonight's bottle",
        price: "10",
      },
      {
        name: "Craft Lager",
        description: "Local, 0.4 l",
        price: "8",
      },
    ],
  },
];

// Navbar links, in page order. Each id must match a section below.
const navLinks = [
  { id: "menu", label: "Menu" },
  { id: "wine", label: "Wine" },
  { id: "visit", label: "Find us" },
];
const navIds = navLinks.map((link) => link.id);

/** Returns the id of the nav section currently in view, or null above the first one. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const header = document.querySelector(".home__header");
      const line = (header?.getBoundingClientRect().bottom ?? 0) + 1;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      let current: string | null = atBottom ? ids[ids.length - 1] : null;
      if (!atBottom) {
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) current = id;
        }
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Short, human status for the hero, e.g. "Open now · until 20:00". */
function openingStatus(now: Date): { open: boolean; text: string } {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const today = hoursOn(day);

  if (today && hour >= today[0] && hour < today[1]) {
    return { open: true, text: `Open now · until ${formatHour(today[1])}` };
  }
  if (today && hour < today[0]) {
    return { open: false, text: `Opens today at ${formatHour(today[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const next = hoursOn((day + i) % 7);
    if (next) {
      const when = i === 1 ? "tomorrow" : dayNames[(day + i) % 7];
      return { open: false, text: `Closed now · opens ${when} at ${formatHour(next[0])}` };
    }
  }
  return { open: false, text: "Closed" };
}

function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`home__brand ${className}`}>
      <img className="home__brand-logo" src={LePantsLogo} alt="" />
      <span className="home__brand-name">{restaurant.name}</span>
    </Link>
  );
}

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const today = new Date().getDay();
  const activeSection = useActiveSection(navIds);
  const status = openingStatus(new Date());

  return (
    <div className="home" id="top">
      <a className="home__skip" href="#main-content">
        Skip to content
      </a>

      <header className="home__header">
        <div className="home__bar">
          <Brand />

          <nav className="home__nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={activeSection === link.id ? "true" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link className="home__btn home__btn--small" to="/reserve">
            Reserve
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* HERO */}
        <section className="home__hero" aria-labelledby="home-title">
          <img
            className="home__hero-img"
            src={interiorImage}
            alt="The Le Pants dining room with set tables and warm lighting"
          />

          <div className="home__hero-text">
            <h1 id="home-title">Smash burgers, served properly.</h1>

            <div className="home__actions">
              <Link className="home__btn" to="/reserve">
                Reserve a table
              </Link>
            </div>

            <p className="home__status">
              <span
                className={`home__status-dot${status.open ? " is-open" : ""}`}
                aria-hidden="true"
              />
              {status.text}
              <a href="#visit">Hours &amp; location</a>
            </p>
          </div>
        </section>

        {/* SIGNATURE BURGER */}
        <section
          className="home__section home__feature"
          id="signature"
          aria-labelledby="signature-title"
        >
          <figure className="home__frame">
            <img
              src={burgerImage}
              alt="Double smash burger with melted cheese"
              loading="lazy"
            />
          </figure>

          <div className="home__feature-text">
            <p className="home__eyebrow">The signature burger</p>
            <div className="home__title-row">
              <h2 id="signature-title" className="home__h2">
                Le Pants Double Smash
              </h2>
              <span className="home__price">€19</span>
            </div>

            <p className="home__lead">
              Two dry-aged beef patties pressed hard on a hot iron, smoked
              gruyère and aged cheddar, pickles and slow-cooked onions in a
              toasted brioche bun.
            </p>
          </div>
        </section>

        {/* MENU */}
        <section
          className="home__menu"
          id="menu"
          aria-labelledby="menu-title"
        >
          <div className="home__menu-head">
            <p className="home__eyebrow">À la carte</p>
            <h2 id="menu-title" className="home__h2">
              The menu
            </h2>
          </div>


          <div className="home__menu-grid">
            {menu.map((group) => (
              <section
                key={group.title}
                className="home__menu-group"
                aria-label={group.title}
              >
                <h3 className="home__label">{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.name} className="home__menu-item">
                      <div className="home__menu-line">
                        <span className="home__menu-name">{item.name}</span>
                        <span className="home__leader" aria-hidden="true" />
                        <span className="home__menu-price">€{item.price}</span>
                      </div>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="home__menu-note">
            Please tell us about allergies when you book. Menu changes with the
            season.
          </p>
        </section>

        {/* WINE */}
        <section
          className="home__section home__feature home__feature--reverse"
          id="wine"
          aria-labelledby="wine-title"
        >
          <figure className="home__frame">
            <img
              src={winePourImage}
              alt="Red wine being poured at a set table"
              loading="lazy"
            />
          </figure>

          <div className="home__feature-text">
            <p className="home__eyebrow">Wine by the glass</p>
            <h2 id="wine-title" className="home__h2">
              A glass beside it
            </h2>
            <p className="home__lead">
              Red and white wine by the glass, chosen to stand up to a burger.
              Ask us what is open tonight.
            </p>
          </div>
        </section>

        {/* DESSERT */}
        <section
          className="home__section home__feature"
          id="dessert"
          aria-labelledby="dessert-title"
        >
          <figure className="home__frame">
            <img
              src={brownieImage}
              alt="Warm chocolate brownie with vanilla ice cream and a cherry"
              loading="lazy"
            />
          </figure>

          <div className="home__feature-text">
            <p className="home__eyebrow">To finish</p>
            <div className="home__title-row">
              <h2 id="dessert-title" className="home__h2">
                Dark Chocolate Brownie
              </h2>
              <span className="home__price">€9</span>
            </div>
            <p className="home__lead">
              Served warm with vanilla ice cream, a ribbon of chocolate and a
              cherry on top.
            </p>
          </div>
        </section>

        {/* VISIT — hours, location and contact in three even columns */}
        <section className="home__visit" id="visit" aria-labelledby="visit-heading">
          <div className="home__visit-head">
            <p className="home__eyebrow">Visit us</p>
            <h2 id="visit-heading" className="home__h2">
              On the Esplanadi
            </h2>
          </div>

          <div className="home__visit-grid">
            <section className="home__visit-col" aria-labelledby="hours-title">
              <h3 id="hours-title" className="home__label">
                Opening hours
              </h3>
              <dl className="home__hours">
                {openingHours.map((row) => {
                  const isToday = row.match.includes(today);
                  return (
                    <div
                      key={row.days}
                      className={isToday ? "is-today" : undefined}
                    >
                      <dt>
                        {row.days}
                        {isToday && <span className="sr-only"> (today)</span>}
                      </dt>
                      <dd>{row.time}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            <section className="home__visit-col" aria-labelledby="location-title">
              <h3 id="location-title" className="home__label">
                Location
              </h3>
              <address className="home__address">
                <span className="home__visit-big">{restaurant.street}</span>
                <span>{restaurant.city}</span>
              </address>
              <a
                className="home__visit-link"
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            </section>

            <section className="home__visit-col" aria-labelledby="contact-title">
              <h3 id="contact-title" className="home__label">
                Reservations &amp; inquiries
              </h3>
              <a
                className="home__visit-big home__visit-tel"
                href={`tel:${restaurant.telephone}`}
              >
                {restaurant.telephoneLabel}
              </a>
              <a className="home__visit-link" href={`mailto:${restaurant.email}`}>
                {restaurant.email}
              </a>
            </section>
          </div>
        </section>
      </main>

      <footer className="home__footer">
        <Brand className="home__brand--footer" />
        <p className="home__fineprint">
          © {new Date().getFullYear()} {restaurant.name}
          {!isLoading && (
            <>
              {" · "}
              <Link
                className="home__staff"
                to={isAuthenticated ? "/dashboard" : "/login"}
              >
                {isAuthenticated ? "Dashboard" : "Staff"}
              </Link>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
