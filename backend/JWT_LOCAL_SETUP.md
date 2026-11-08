JWT_SECRET – paikallisen kehitysympäristön käyttöönotto
Le Pants -backend tarvitsee JWT_SECRET-ympäristömuuttujan JWT-tokenien luontiin ja tarkistamiseen.

Jokainen kehittäjä luo oman paikallisen avaimensa kerran. Avainta ei tallenneta GitHubiin eikä jaeta tiimin keskustelussa. Rahti-tuotantoympäristön avain määritellään erikseen palvelimelle.
Windows (PowerShell)
Avaa VS Coden PowerShell-terminaali. Suorita seuraavat komennot:
# Luo turvallinen 32 tavun (256 bitin) satunnaisavain.
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes)

# Aseta avain nykyiseen terminaaliin ja pysyvästi Windows-käyttäjälle.
$env:JWT_SECRET = $secret
[Environment]::SetEnvironmentVariable("JWT_SECRET", $secret, "User")

# Tarkista, että pysyvästi tallennettu avain on 32 tavua.
$stored = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
if ([Convert]::FromBase64String($stored).Length -eq 32) {
    Write-Host "JWT_SECRET OK (32 bytes)"
} else {
    throw "JWT_SECRET ei ole oikean pituinen"
}
Odotettu tulos: JWT_SECRET OK (32 bytes).

Avain säilyy Windows-käyttäjän ympäristömuuttujissa myös VS Coden ja tietokoneen uudelleenkäynnistyksen jälkeen. Avaa VS Code uudelleen, jotta uudet terminaalit lukevat tallennetun muuttujan.

Jos avain on jo tallennettu, älä generoi sitä uudelleen. Voit tarkistaa sen näin:
$stored = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
if ($stored -and [Convert]::FromBase64String($stored).Length -eq 32) {
    "JWT_SECRET OK"
} else {
    "JWT_SECRET puuttuu tai on virheellinen"
}
Jos pysyvä avain on tallessa mutta nykyisestä PowerShell-istunnosta puuttuu muuttuja, voit ottaa saman avaimen käyttöön sulkematta terminaalia:
$env:JWT_SECRET = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
macOS / Linux (zsh tai bash)
Avaa terminaali. Valitse oman shellin asetustiedosto:
- macOS (yleensä zsh): ~/.zshrc
- Linux (yleensä bash): ~/.bashrc
Esimerkki zsh-käyttäjälle:
printf '\nexport JWT_SECRET="%s"\n' "$(openssl rand -base64 32)" >> ~/.zshrc
source ~/.zshrc
bash-käyttäjä korvaa kummassakin komennossa ~/.zshrc → ~/.bashrc.

Tarkistus:
if [ -n "$JWT_SECRET" ]; then echo "JWT_SECRET OK"; else echo "JWT_SECRET puuttuu"; fi
Tee tallennus vain kerran. Tämän jälkeen avain latautuu uusissa shell-istunnoissa. Varmista, että shellin asetustiedosto pysyy vain omalla koneellasi.
Backendin käynnistäminen
Projektissa on seuraava asetus tiedostossa backend/src/main/resources/application.properties:
jwt.secret=${JWT_SECRET}
jwt.expiration-minutes=60
Muuttujan nimi on täsmälleen JWT_SECRET (isot kirjaimet ja alaviiva).

Windowsissa (backend-kansiossa):
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
macOS/Linuxissa (backend-kansiossa):
./mvnw clean test
./mvnw spring-boot:run
Jos Spring Boot ilmoittaa, ettei JWT_SECRET löydy, varmista, että muuttuja näkyy siinä terminaalissa, josta käynnistät backendin.
Tärkeää
- Älä lisää salaisen avaimen arvoa GitHubiin, .properties-tiedostoon, issueen tai Teams-viestiin.
- Paikalliset kehittäjät voivat käyttää eri avaimia, koska heidän paikalliset backendinsä ovat erillisiä.
- Saman backend-ympäristön useiden instanssien täytyy käyttää samaa avainta, jotta niiden luomat tokenit voidaan tarkistaa kaikkialla.
- Avaimen vaihtaminen mitätöi aiemmalla avaimella allekirjoitetut JWT-tokenit kyseisessä ympäristössä.
- Rahti: tuotannon JWT-avain luodaan ja määritetään erikseen Kubernetes Secretin kautta. Sitä ei oteta kehittäjän koneelta eikä työnnetä GitHubiin.
- GitHub Actions: backend-testien tarvitsemalle JWT_SECRET-muuttujalle pitää määrittää erillinen testiarvo CI-workflow'hun ennen JWT-muutosten yhdistämistä dev-haaraan.