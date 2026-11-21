# Le Pants Design Rules

Read this before changing any UI. It describes what the app **actually ships**. If code and this file disagree, fix one of them in the same change.

**The feel:** a calm, dark, candle-lit restaurant. Quiet confidence, lots of space, one accent colour. When unsure, remove something rather than add it.

History: first drafts were made in Stitch ([v1](https://stitch.withgoogle.com/projects/16575207833716961824), [v2](https://stitch.withgoogle.com/projects/427455009647000198)), then refined with Claude.

---

## 1. Where things live

| What | File |
| --- | --- |
| Tailwind tokens (`wine`, `dark-bg`, `card-bg`, `card-border`, `surface-input`, `font-headline`, `font-sans`) and font loading | `frontend/src/styles/index.css` |
| Home page styles (plain CSS, `home__*` classes, `--pink`, `--wine`, `--muted`…) | `frontend/src/styles/HomePage.css` |
| Staff layout and shared staff button classes (`btn`, `primaryBtn`, `focusRing`) | `frontend/src/components/OwnerShell.tsx` |
| Logo | `frontend/src/assets/LePantsLogo.svg` |
| Photos | `frontend/src/assets/*.png / *.jpg` |

---

## 2. Colours

Use only these. Don't invent new shades.

| Role | Value | Use for |
| --- | --- | --- |
| Page background | `#121316` (`dark-bg`) | Every page |
| Deep section | `#0E0F12` | Alternating home sections, footer |
| Card | `#18191E` (`card-bg`) | Cards, panels |
| Input | `#1F2027` (`surface-input`) | Form fields |
| Hairline | `#272832` (`card-border`) | Borders, dividers |
| Text | `#FFFFFF` / `#E4E4E7` | Headings / body |
| Muted text | `#A1A1AA` (zinc-400) | Labels, secondary text. Never dimmer than this. |
| **Wine** (accent) | `#9B1B44`, border/hover `#B52252` | Primary buttons only, active nav bar |
| **Pink** (soft accent) | `#FFB2BF` | Prices, active nav link, outline buttons, small highlights |
| Error | `text-red-400` | Error messages |

Rules:
- **One accent at a time.** Wine is for the main action. Pink is for small highlights. If everything is coloured, nothing stands out.
- **Section labels (eyebrows) are grey**, not pink.
- No green/amber/red "traffic light" bars. Only exception: a small green dot for "Open now".

---

## 3. Fonts

| Font | Tailwind | Use for |
| --- | --- | --- |
| **Playfair Display, italic, weight 400** | `font-headline italic font-normal` | The "Le Pants" name, page titles, section headings, dish names, prices |
| **Inter** | `font-sans` (default) | Everything else: body, forms, buttons, nav, tables, times |

Rules:
- **"Le Pants" is always Playfair Display italic, regular weight.** Never bold, never Inter. Same on home page, reservation form, login and staff sidebar.
- Never use Playfair for body text, form labels, tables or numbers in data.
- Small labels: uppercase Inter, 11–13px, letter-spacing `0.14em`–`0.2em`, muted grey.
- Data numbers (times, guests, KPIs): `tabular-nums`.
- Minimum text: 14px (inputs 16px so iOS doesn't zoom).

---

## 4. Logo

- `LePantsLogo.svg`, always in a **round** badge (`rounded-full`) with a thin border.
- Shown next to or above the "Le Pants" wordmark (see fonts).
- If the name is visible next to it, use `alt=""` so screen readers don't read the name twice.

---

## 5. Buttons

| Type | Look | When |
| --- | --- | --- |
| **Primary** | Wine `#9B1B44` fill, `#B52252` border, white text, **pill** (`rounded-full`), min 48px tall | The one main action on a screen (Reserve a table, Confirm, Sign in) |
| **Outline pill** | Transparent, pink border and pink uppercase letter-spaced text, fills wine on hover | Navbar "Reserve", "← Home" on reservation form |
| **Ghost (staff)** | Transparent, `1px #3F3F46` border, 4px radius, min 44px | Secondary staff actions |
| **Text link** | Underlined or plain muted text | Tiny actions (e.g. "Staff" in footer) |

Rules:
- One primary button per screen section. Don't repeat the same CTA in every section — the navbar already has Reserve.
- Every interactive element: at least 44×44px touch area and a visible `:focus-visible` outline.

---

## 6. Photos

- Dark, moody, low-light photos on dark backgrounds only. No bright daylight shots.
- **No visible text, logos or branding from other businesses** in photos.
- All feature photos use the **same 4:5 portrait crop** (`aspect-ratio: 4/5; object-fit: cover`), same radius (10px).
- One photo per section. No collages, no staggered pairs, no text chips over food photos.
- Every photo needs real `alt` text describing it (decorative backgrounds use `alt=""`).

---

## 7. Layout

- **Mobile first.** Write base styles for phones, then add `@media (min-width: 720px)` / `1100px` for wider screens.
- Home page order: Hero → Signature burger → Menu (text only) → Wine → Dessert → Find us → Footer.
- Feature sections alternate image left / right on desktop; on phones the image sits above the text.
- Generous space between sections. Don't put boxes around everything — use whitespace and thin hairlines.
- Sticky header: anchor targets need `scroll-margin-top` equal to the header height.

---

## 8. Page-specific rules

### Home page
- Navbar: logo + "Le Pants" left, links centred (**Menu · Wine · Find us**), outline "Reserve" pill right. Active section link is pink with a wine underline.
- Hero: one headline, one primary button, live opening status ("Open now · until 20:00").
- Menu: printed-menu style text list with dotted leaders; prices in Inter, signature prices in Playfair pink.
- Staff link is tiny and grey at the end of the copyright line. Never near the logo.

### Reservation form
- **Step by step.** Date → party size → time first. Contact details and Confirm stay hidden until a time is picked, then **slide open gently** (~0.7s, `.reveal` in `index.css`). Never auto-scroll the page.
- Respect `prefers-reduced-motion` for all animation.
- Seats: show the count **only for the selected time** ("18 seats free at 12:00"). Other time buttons show nothing, except a small "Few left" tag when ≤ 10 seats remain.
- Friendly but professional, short copy. Example: "You can book a table for any time up to 17:00." Avoid overly personal phrases ("we'd love to see you").
- No staff sign-in link on the customer form.

### Login (staff)
- Blurred, darkened dining-room photo behind a frosted card.
- "Le Pants" + small "STAFF" label above the card; "Welcome back" in Playfair italic.

### Staff area (`OwnerShell`)
- Desktop: sticky left rail (`#121316`), collapsible. Active nav item: white text + 3px `#B52252` bar on the left, `aria-current="page"`.
- Mobile: top bar + bottom tab bar (Bookings, Stats, Users, Account), active tab has a 3px `#B52252` bar on top.
- Denser than guest pages, but same colours and fonts. Status badges always pair colour with text.

---

## 9. Don't

- ❌ Bold Playfair, or "Le Pants" in Inter
- ❌ Red filled badges/boxes for prices or "Today"
- ❌ Numbers on every time slot, live clocks, blinking dots, traffic-light bars
- ❌ Sudden pop-ins or automatic page scrolling
- ❌ Repeating the same button in every section
- ❌ Photos with other restaurants' branding, bright daylight photos, mismatched crops
- ❌ Pink section labels everywhere; boxes around every block
- ❌ Text dimmer than zinc-400, touch targets under 44px, removing focus outlines
