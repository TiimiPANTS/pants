# Vaatimusmäärittely suunnittelu ja hiominen, varsinainen versio tulee myöhemmin PRD.md
22.09.2026 klo 18-19.30

TODO: Lisätään backlogiin puuttuvat tiketit. Pidetään erikseen MVP tiketit ja kehitysideat tiketit.

## Toiminnalliset vaatimukset

### Perus backend
- Relaatiokaavio
- Indeksit
- Dummy SQL data

### Käyttäjähallinta
- Autentikointi / Auktorisiointi
    - salasanan hashing ennen tietokantaan viemistä esim. bcrypt, hcrypt
    - TestLogin.java
- RBAC: Admin, ravintolaomistajat

**Backend**: 
- SecurityConfig = kuka saa käyttää mitäkin endpointtia
- UserDetailsService, menee yhes SecurityCOnfig kans
- AuthController, UserController
- Tietokantaan uusi Users-taulu

**Frontend**: 
- Login/Logout napit
- Kirjautumissivu

**EKSTRAA**
- User registration.
- User login/logout.
- Password reset.
- Account deletion.
- Session management.

### Kuitti + muistutukset
- Mailtrap HTML runko hienommaksi
- EKSTRAA: Email muistutukset varauksesta
- ReservationServiceen varauksen muokkauslinkin luonti. Korjataan service kokonaan, jotta varauksen tallennus toimii E2E tulevissa featureissa.

### Interaktiivinen kalenteri
- Backend: Runko valmis, tarvii täydentää vähän, jotta frontin komponentit toimii
- Frontend: DatePicker

### Dynaaminen "Select time"
- Jos tänään kello on 18, ei voi varata enään samalle päivälle klo 8 varausta
- Piilotetaan siis menneet ajat lomakkeelta varattujen aikojen lisäksi
- Frontend

### Perus frontend elementit
- Etusivu
- Varauslomake (tehty)
    - Yhteystiedot lomakkeen lopussa (ei tarvii erillist sivuu)
- Vahvistussivu
    - Muokkaa varausta -nappi
- Navigointipalkki
- EKSTRA: Hae-sivu eli pystyy hakee ravintoloita / search bar
- Validointi, merkkirajoitukset varauslomakkeen kenttiin
- Loading indicators, loading screen
- Success notifications (tehty jo varauslomakkeelle)
- Poistetaan HTML constraints

### MVP (Minimum Viable Product)
Ensimmäiseen versioon kuuluu:
- Ravintolan tietojen näyttäminen
- Vapaiden aikojen näyttäminen
- Pöytävarauksen tekeminen
- Varauksen muokkaaminen
- Varauksen peruuttaminen
- Sähköpostivahvistus

## Ei-toiminnalliset vaatimukset

### Saatavuus (Saavutettavuus)
- stitch.ai pitää hakee väri HEX-koodit, fonttikoko, fonttityyli
- Riittävät värikontrastit (MVP)
- Selkeä navigointi (MVP)
- Helppokäyttöiset lomakkeet (MVP)
- Vahvistussivu
    - Muokkaa varausta -nappi
- Navigointipalkki
- EKSTRA: Hae-sivu eli pystyy hakee ravintoloita / search bar
- Validointi, merkkirajoitukset varauslomakkeen kenttiin
- Loading indicators, loading screen
- Success notifications (tehty jo varauslomakkeelle)
- Poistetaan HTML constraints

### Responsiivisuus & Ulkoasu
- Responsiivinen käyttöliittymä (MVP)
- Desktop viewport
- Mobile first approach (MVP)
- Selain sopivuus

## Testaus
- CI/CD pipelines, Github Actions
- Yksikkötestit jokaiselle controllerille ja viedään lopuksi CI putkeen
- Jonkin verran integraatiotestei esim. navigointitesti, kalenteritesti, validointitesti
- Muutama E2E
- Testien dokumentointi