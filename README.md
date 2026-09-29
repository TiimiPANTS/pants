# Ohjelmistoprojekti 2 -kurssityö syksy 2026

📋 **Backlog:** https://github.com/orgs/TiimiPANTS/projects/1

🎯 **Retrospektit Miro-taulu:** https://miro.com/app/board/uXjVHqNZkTk=/?share_link_id=954013309038

**Swagger API dokumentaatio:** 
- https://pants-backend.2.rahtiapp.fi/swagger-ui/index.html#

**Main branch deployment with Postgre**
- Backend URL: https://pants-backend.2.rahtiapp.fi
- Frontend URL: https://pants-frontend.onrender.com

**Dev branch deployment with H2**
- Backend URL: https://teampants-git-ohjelmistoprojekti2-teampants.2.rahtiapp.fi
- Frontend URL: https://pants-mir9.onrender.com

Alkuperäinen projektisuunnitelma ja muu dokumentaatio löytyy docs-kansiosta. Kaikki käyttäjätarinat backlogilla.

---

👖 **Ryhmä:** Pants
- Phong Nguyen ([PhongNgvyen](https://github.com/PhongNgvyen))
- Arttu Inkala ([archiartt](https://github.com/archiartt))
- Ngan Tran ([ng4nt](https://github.com/ng4nt))
- Thomas Obeng ([bhu629](https://github.com/bhu629))
- Sara Junnila ([sawasda](https://github.com/sawasda))

*Suluissa Github-nimet ja hyperlinkit profiileihin*

---

**Projektin nimi:** Ravintolan pöytävarausjärjestelmä

**Kuvaus:** Toteutamme kuvitteelliselle Le Pants -ravintolalle pöytävarausjärjestelmän websovelluksen muodossa noudatten Scrum-viitekehystä.

**Tavoite:** Toteutettava sovellus on verkkopohjainen pöytävarausjärjestelmä, jonka avulla asiakkaat voivat tarkistaa vapaat ajat sekä tehdä, muokata ja perua varauksia itsenäisesti ilman ravintolan henkilökunnan apua. Järjestelmän tavoitteena on vähentää puhelimitse ja muiden kanavien kautta tehtävää manuaalista työtä, ehkäistä virheitä ja parantaa yleistä asiakaskokemusta tehostamalla varausten hallintaa.

**Tärkeimmät ominaisuudet:**
Sovelluksen ensimmäisessä versiossa (MVP) käyttäjä voi tehdä seuraavia asioita.
- Tarkastella ravintolan tietoja, aukioloaikoja ja yhteystietoja.  
- Nähdä ravintolan vapaat varausajat, jotta sopivan ajankohdan valitseminen on helppoa.   
- Varata pöydän valitulle henkilömäärälle. 
- Muokata tekemäänsä varausta ennen varauksen ajankohtaa suunnitelmien muuttuessa.  
- Peruuttaa varauksensa, jolloin aika vapautuu muiden käyttöön.  
- Vastaanottaa onnistuneesta varauksesta sähköpostivahvistuksen.  

---

**Toteutusteknologiat**
- Frontend: React Framework Typescript
    - Node 24
- Backend: Java Spring Boot
    - Java 21
- Tietokanta: PostgreSQL
- Testaus: Postman, Swagger, JUnit, Mockito, Github Actions, Playwright
- Sähköpostitestaus: Mailtrap
- Paketinhallinta: npm
- Deployment: Render tai muu


---
**Lokaalin projektin käynnistys**

Backend käynnistys http://localhost:8080/
1. `cd backend`
2. `mvnw.cmd spring-boot:run`

Frontend käynnistys http://localhost:5173/
1. `cd frontend`
2. `npm install` 
3. `npm run dev`
*HUOM! npm install ajetaan vain ensimmäisellä kerralla. Sen jälkeen aina npm run dev.*

Perus application.properties on kytketty vain H2-tietokantaan ja ei ole kytketty Mailtrapiin. 
Kysy admineiltä application-local.properties tiedostoa, jos tarvitset.