# Tuotteen vaatimusmäärittely eli PRD

## 1. Yleiskuva

Monissa ravintoloissa pöytävarauksia tehdään yhä puhelimitse tai usean eri kanavan kautta. Se vie henkilökunnan aikaa ja lisää virheiden riskiä.

Ratkaisuna on verkkopohjainen varausjärjestelmä, jossa asiakas näkee vapaat ajat ja voi tehdä, muokata tai perua varauksen ilman henkilökunnan apua. Ravintola hallitsee varauksiaan tehokkaammin ja manuaalinen työ vähenee.

**Tavoitteet**

1. Toimiva MVP, joka kattaa koko varausketjun: katselu, varaus, muokkaus, peruutus ja sähköpostivahvistus.
2. Responsiivinen, mobile first -periaatteella tehty ja saavutettava käyttöliittymä.
3. Ravintolan ylläpitäjä näkee varaukset ja hallitsee ravintolan tietoja ja aukioloaikoja turvallisesti.
4. Testattu koodipohja, jota GitHub Actions tarkistaa automaattisesti.

**Rajaukset (ei MVP:ssä):** useiden ravintoloiden tuki, karttanäkymä, arvostelut, asiakkaiden käyttäjätilit, muistutussähköpostit ja uudelleenvaraus. Sovellus on web-sovellus, ei natiivi mobiilisovellus.

## 2. Käyttäjät ja käyttäjätarinat

Järjestelmällä on kaksi käyttäjäryhmää: asiakkaat, jotka varaavat ilman kirjautumista, ja ravintolan ylläpitäjät, jotka kirjautuvat sisään roolipohjaisella käyttöoikeudella (ravintolaomistaja).

| Tunnus | Käyttäjätarina |
| --- | --- |
| US-1 | Käyttäjänä haluan nähdä ravintolan vapaat ajat, jotta voin valita sopivan ajankohdan. |
| US-2 | Käyttäjänä haluan varata pöydän haluamalleni henkilömäärälle, jotta voin suunnitella ravintolakäyntini. |
| US-3 | Käyttäjänä haluan muokata varaustani ennen varauksen ajankohtaa, jotta voin tehdä muutoksia suunnitelmien muuttuessa. |
| US-4 | Käyttäjänä haluan perua varaukseni, jotta aika vapautuu muiden käyttöön. |
| US-5 | Käyttäjänä haluan saada sähköpostivahvistuksen, jotta tiedän varauksen onnistuneen. |
| US-6 | Käyttäjänä haluan nähdä aukioloajat ja yhteystiedot, jotta löydän tarvitsemani tiedot helposti. |
| US-7 | Ylläpitäjänä haluan kirjautua sisään ja nähdä varaukset, jotta voin hallita ravintolan arkea. **[Ehdotus]** |
| US-8 | Ylläpitäjänä haluan hallita ravintolan tietoja ja aukioloaikoja. **[Ehdotus]** |

## 3. Laajuus

MVP sisältää vain ne ominaisuudet, joita ilman varausketju ei toimi. Muut ominaisuudet pidetään backlogissa erillisinä tiketteinä.

**MVP (pakollinen)**

- Ravintolan tietojen näyttäminen
- Vapaiden aikojen näyttäminen
- Pöytävarauksen tekeminen
- Varauksen muokkaaminen
- Varauksen peruuttaminen
- Sähköpostivahvistus
- Responsiivinen käyttöliittymä, riittävät värikontrastit, selkeä navigointi ja helppokäyttöiset lomakkeet

**Tärkeä, mutta ei MVP-listalla**

- Kirjautuminen ja roolipohjainen käyttöoikeus ylläpitäjille
- Interaktiivinen kalenteri (DatePicker) ja dynaaminen ajanvalinta
- Lomakkeiden validointi, latausindikaattorit ja onnistumisilmoitukset
- Hienompi HTML-sähköpostipohja
- Testit ja CI/CD-putki

**Jatkokehitys (extra)**

- Käyttäjän rekisteröinti, salasanan palautus, tilin poisto ja istunnonhallinta
- Sähköpostimuistutukset varauksesta
- Hakusivu ja hakukenttä ravintoloiden etsimiseen
- Useiden ravintoloiden tuki ja karttanäkymä
- Arvostelut ja kommentit
- Varauksen uudelleenvaraus

## 4. Toiminnalliset vaatimukset

Vaatimukset on ryhmitelty aiheittain, ja jokaisella on prioriteetti. Tunnuksia (FR) voi käyttää backlogin tikettien viitteinä.

| Tunnus | Vaatimus | Prioriteetti |
| --- | --- | --- |
| FR-1 | Relaatiotietokannan kaavio (ER-kaavio) ja indeksit yleisimmille hauille | MVP |
| FR-2 | Dummy SQL -data kehitykseen ja demoon | MVP |
| FR-3 | Asiakas voi tehdä varauksen: päivä, kellonaika, henkilömäärä ja yhteystiedot | MVP |
| FR-4 | Yhteystiedot kerätään varauslomakkeen lopussa, ei erillisellä sivulla | MVP |
| FR-5 | ReservationService korjataan niin, että varauksen tallennus toimii päästä päähän | MVP |
| FR-6 | ReservationService luo varaukselle muokkauslinkin | MVP |
| FR-7 | Asiakas voi muokata varausta linkin kautta ennen varauksen ajankohtaa | MVP |
| FR-8 | Asiakas voi perua varauksen | MVP |
| FR-9 | Varauksesta lähtee sähköpostivahvistus (testaus Mailtrapilla) | MVP |
| FR-10 | Etusivu, jossa ravintolan tiedot, aukioloajat ja yhteystiedot | MVP |
| FR-11 | Vahvistussivu ja "Muokkaa varausta" -painike | MVP |
| FR-12 | Navigointipalkki | MVP |
| FR-13 | Kalenterin backend valmiiksi niin, että frontendin komponentit toimivat | Tärkeä |
| FR-14 | Interaktiivinen DatePicker frontendiin | Tärkeä |
| FR-15 | Dynaaminen "Select time": menneet ajat piilotetaan varattujen aikojen lisäksi (esim. klo 18 ei voi varata samalle päivälle klo 8) | Tärkeä |
| FR-16 | Salasanat tiivistetään (esim. bcrypt) ennen tallennusta tietokantaan | Tärkeä |
| FR-17 | RBAC: roolit Admin ja Ravintolaomistaja; SecurityConfig määrittää, kuka saa käyttää mitäkin endpointia | Tärkeä |
| FR-18 | UserDetailsService, AuthController ja UserController sekä uusi Users-taulu | Tärkeä |
| FR-19 | Kirjautumissivu sekä Login- ja Logout-painikkeet | Tärkeä |
| FR-20 | Ylläpitäjä näkee varaukset päivän mukaan suodatettuna **[Ehdotus]** | Tärkeä |
| FR-21 | Ylläpitäjä voi muokata ravintolan tietoja ja aukioloaikoja **[Ehdotus]** | Tärkeä |
| FR-22 | Lomakekenttien validointi ja merkkirajoitukset; HTML-rajoitteet poistetaan | Tärkeä |
| FR-23 | Latausindikaattorit ja latausnäkymä | Tärkeä |
| FR-24 | Onnistumisilmoitukset (varauslomakkeella jo tehty) | Tärkeä |
| FR-25 | Hienompi HTML-runko sähköpostivahvistukseen | Tärkeä |
| FR-26 | Sähköpostimuistutukset varauksesta | Extra |
| FR-27 | Rekisteröinti, salasanan palautus, tilin poisto, istunnonhallinta | Extra |
| FR-28 | Hakusivu ja hakukenttä ravintoloiden etsimiseen | Extra |

## 5. Ei-toiminnalliset vaatimukset

**Saavutettavuus**

- Riittävät värikontrastit (MVP)
- Selkeä navigointi (MVP)
- Helppokäyttöiset lomakkeet (MVP)
- Värien HEX-koodit, fonttikoko ja fonttityyli haetaan stitch.ai:sta ja otetaan käyttöön johdonmukaisesti
- **[Ehdotus]** Tavoitteena WCAG 2.1 AA -taso, mukaan lukien näppäimistökäyttö ja lomakekenttien selkeät otsikot

**Responsiivisuus ja ulkoasu**

- Responsiivinen käyttöliittymä (MVP)
- Mobile first -lähestymistapa (MVP)
- Toimii desktop-näkymässä
- Selainyhteensopivuus tarkistetaan

**Tietoturva**

- Salasanat tiivistetään ja endpointit suojataan rooleilla (FR-16 ja FR-17)
- **[Ehdotus]** Syötteet validoidaan myös palvelimella, ei vain frontendissa
- **[Ehdotus]** Muokkauslinkki sisältää arvaamattoman tunnisteen, jotta muut eivät voi muokata toisen varausta

## 6. Teknologiat ja tietomalli

| Osa-alue | Valinta |
| --- | --- |
| Frontend | React |
| Backend | Java Spring Boot |
| Tietokanta | PostgreSQL |
| Sähköpostitestaus | Mailtrap |
| Ulkoasun lähde | stitch.ai |
| CI/CD | GitHub Actions |
| Julkaisu | Render tai muu |


## 7. Testaus ja onnistumiskriteerit

**Testaus**

- Yksikkötestit jokaiselle controllerille; ne viedään lopuksi CI-putkeen
- Jonkin verran integraatiotestejä, esim. navigointi-, kalenteri- ja validointitesti
- Muutama E2E-testi
- CI/CD-putki GitHub Actionsilla
- Testien dokumentointi

**Onnistumiskriteerit** **[Ehdotus]**

- Kaikki kuusi MVP-ominaisuutta toimivat päästä päähän julkaistussa sovelluksessa.
- Varausta ei voi tehdä menneelle ajalle eikä jo varatulle ajalle.
- Jokaisesta varauksesta lähtee vahvistussähköposti, jossa on toimiva muokkauslinkki.
- Käyttöliittymä toimii sekä puhelimella että työpöytäselaimella.
- CI-putki ajaa kaikki testit jokaisella pushilla ja menee läpi.
- Ylläpidon endpointit eivät ole käytettävissä ilman oikeaa roolia.

## 8. Riskit, avoimet kysymykset ja seuraavat askeleet

**Riskit**

- Laajuuden kasvu: moni "extra" kilpailee MVP:n kanssa. Ratkaisu: MVP- ja kehitysideatiketit pidetään erillään.
- Kaksoisvaraukset: tarkistetaan saatavuus backendissä ja tietokannassa.
- ReservationService ei vielä tallenna varausta päästä päähän. Korjataan ensimmäisenä, koska muut ominaisuudet riippuvat siitä.
- Opiskelijaprojektin rajallinen aika: "extra"-asiat jätetään ensimmäisenä pois.

**Oletukset:** MVP palvelee yhtä ravintolaa, asiakkaalla on internetyhteys ja toimiva sähköpostiosoite, ja sähköpostit lähetetään Mailtrapin kautta kehityksessä ja demossa.

**Avoimet kysymykset tiimille**

1. Kuuluuko ylläpitäjän kirjautuminen MVP:hen? Projektisuunnitelmassa autentikointi on jatkokehitysideana, mutta vaatimusmuistiinpanoissa se on keskeinen. Tämä PRD olettaa, että se on "Tärkeä", ei MVP.
2. Lasketaanko vapaat ajat yksittäisten pöytien vai ravintolan kokonaiskapasiteetin mukaan?
3. Kuinka kauan varaus varaa pöydän, ja mikä on aikavälien pituus?
4. Voiko varausta muokata tai perua viime hetkeen asti vai onko määräaika?
5. Mikä on suurin sallittu henkilömäärä ja miten isommat ryhmät hoidetaan?
6. Mitä Admin ja Ravintolaomistaja voivat tehdä eri tavalla?
7. Salasanan tiivistykseen sopii bcrypt (muistiinpanoissa "bcrypt, hcrypt"). Vahvistetaanko valinta?

**Seuraavat askeleet**

1. Ratkaistaan avoimet kysymykset.
2. Luodaan backlog: MVP-tiketit ja kehitysideatiketit erikseen, FR-tunnukset viitteinä.
3. Korjataan ReservationService.
4. Viimeistellään ER-kaavio, indeksit ja dummy-data.
5. Korvataan tämä luonnos lopullisella PRD.md-versiolla.
6. Mainitaan tekoälyn käyttö ja miten sitä esim. käytetty dokumentoinnissa ja koodauksessa jne.