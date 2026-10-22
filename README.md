# Ohjelmistoprojekti 2 -kurssityö syksy 2026

[![Backend tests](https://img.shields.io/github/actions/workflow/status/TiimiPANTS/pants/github-actions-demo.yml?job=backend-tests&label=Backend%20tests&branch=main)](https://github.com/TiimiPANTS/pants/actions/workflows/github-actions-demo.yml)
[![Frontend tests](https://img.shields.io/github/actions/workflow/status/TiimiPANTS/pants/github-actions-demo.yml?job=frontend-tests&label=Frontend%20tests&branch=main)](https://github.com/TiimiPANTS/pants/actions/workflows/github-actions-demo.yml)

[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot 4.1.1](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![H2](https://img.shields.io/badge/H2-Database-09476B)](https://www.h2database.com/)

[![Swagger](https://img.shields.io/badge/Swagger-API_Docs-85EA2D?logo=swagger&logoColor=black)](https://swagger.io/)
[![JUnit](https://img.shields.io/badge/JUnit-5-25A162?logo=junit5&logoColor=white)](https://junit.org/junit5/)
[![Mockito](https://img.shields.io/badge/Mockito-Testing_Framework-C5D9C8)](https://site.mockito.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Tests-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Mailtrap](https://img.shields.io/badge/Mailtrap-Email_Testing-22D172)](https://mailtrap.io/)

[![Backend deployment: Rahti](https://img.shields.io/badge/Backend_deployment-Rahti-0078D4)](https://pants-backend.2.rahtiapp.fi)
[![Render deployment](https://img.shields.io/badge/Frontend_Deployment-Render-46E3B7)](https://pants-frontend.onrender.com)
![Pukki deployment](https://img.shields.io/badge/PostgreSQL_Deployment-Pukki-6B7280)

📋 **Backlog:** https://github.com/orgs/TiimiPANTS/projects/1

🎯 **Retrospektit Miro-taulu:** https://miro.com/app/board/uXjVHqNZkTk=/?share_link_id=954013309038

⭐ **Swagger API dokumentaatio:** https://pants-backend.2.rahtiapp.fi/swagger-ui/index.html#

**Main branch deployment with Postgre**
- Backend URL: https://pants-backend.2.rahtiapp.fi
- Frontend URL: https://pants-frontend.onrender.com

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
### **Lokaalin projektin ja testien käynnistys**

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

---

Backend-testit vaativat Java 21

Windows (PowerShell):
```powershell
cd backend
.\mvnw.cmd --batch-mode --no-transfer-progress test
```

macOS/Linux:
```bash
cd backend
./mvnw --batch-mode --no-transfer-progress test
```

---

Frontend-testit vaativat Node 22

```bash
cd frontend
npm ci
npx playwright install 
npm test
```
*HUOM! Lataa Playwright riippuvuus vain ensimmäisellä kerralla!*