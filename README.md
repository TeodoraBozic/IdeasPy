Pokretanje:
.\.venv\Scripts\activate
python -m uvicorn main:app --reload

ovaj projekat ima:
korisnika koji moze da postavi poslovne ideje
poslovna ideja: startup
evaluation: veza izmedju korisnika i ideje i ocena i komentar

✅ 1. Autentifikaciju i autorizaciju
Da znaš ko je ulogovan i da ograničiš pristup:

🔐 Registracija i login (JWT tokeni)

🙋‍♀️ Svaki zahtev dolazi sa Authorization: Bearer <token>

✅ Zaštićeni endpointi: korisnik može menjati samo svoje ideje, ne tuđe

📚 Koristi fastapi.security.OAuth2PasswordBearer, passlib za hešovanje lozinki i jose za JWT token.

✅ 2. Ocene: prosek i analitika
Dodaj analitiku i “inteligenciju”:

📊 Prosečna ocena ideje

🔝 Rangiranje ideja po popularnosti (broj ocena, prosečna ocena)

🎯 Broj ocena po korisniku

✅ 3. Agregacije u MongoDB (ne kroz Python)
Umesto da sve radiš ručno:

Koristi $lookup za “join”

Koristi $group za prosečne ocene i brojanja

Primer:

js
Copy
Edit
db.evaluations.aggregate([
{ $match: { idea_id: ObjectId("...") } },
{ $group: { _id: "$idea_id", avgScore: { $avg: "$score" }, count: { $sum: 1 } } }
])
✅ 4. Bolja struktura projekta
Organizuj aplikaciju:

pgsql
Copy
Edit
app/
├── main.py
├── models/
│ └── schemas.py (Pydantic modeli)
├── database/
│ └── mongo.py
├── routers/
│ ├── users.py
│ ├── ideas.py
│ └── evaluations.py
├── auth/
│ ├── jwt.py
│ └── security.py
✅ 5. OpenAPI dokumentacija i Swagger UI poboljšanja
Dodaj opise ruta, primera, odgovora (description=, responses=)

Swagger će izgledati kao pravi API za profesionalnu upotrebu

✅ 6. Testiranje
📦 pytest

Testiraj rute, validaciju, greške

Primer:

python
Copy
Edit
def test_create_idea(client):
response = client.post("/ideas/", json={...})
assert response.status_code == 201
✅ 7. Docker i Deployment
🐳 Napravi Dockerfile

Deployment na:

Render, Railway, Deta, Fly.io (besplatni serveri)

Ili tvoj VPS ako imaš

✅ 8. Frontend (ako planiraš)
Možeš povezati s:

React / Vue / Svelte

Ili samo Postman za testiranje

---

Dodavanje uloga i prava pristupa (Role-based access control - RBAC)
Ako već imaš polje Role (npr. admin, user), možemo da:

dozvolimo adminima da uređuju ili brišu tuđe ideje,

a običnim korisnicima da uređuju samo svoje ideje.

Primer:

python
Copy
Edit
if current_user.role != "admin" and idea.created_by != current_user.id:
raise HTTPException(status_code=403, detail="Nisi ovlašćen da menjaš ovu ideju.")
✅ 2. Komentari na ideje
Dodaj novu kolekciju ili model za komentare. Svaki komentar ima:

text

created_by

idea_id

created_at

Na taj način korisnici mogu komunicirati ispod ideja.

✅ 3. Ocene ili evaluacije ideja (rating/voting)
Dodaj funkcionalnost gde korisnici mogu:

dati ocenu ideji (npr. 1-5),

ili glasati za/protiv ideje.

Dodatak: Ograničiti da korisnik može glasati samo jednom po ideji.

✅ 4. Pretraga i filtriranje ideja
Dodaj endpoint gde možeš pretraživati ideje po:

nazivu,

autoru,

tagovima,

datumu kreiranja.

To ti omogućava bolju upotrebljivost i organizaciju.

✅ 5. Tagovi ili kategorije ideja
Daj korisnicima mogućnost da dodaju tagove ili izaberu kategoriju (npr. "tehnologija", "umetnost", "društvo").

To omogućava klasifikaciju i lakše filtriranje.

✅ 6. Notifikacije (osnovna verzija)
Kad neko ostavi komentar ili oceni ideju, pošalji notifikaciju korisniku koji je napravio tu ideju (može i samo kao zapis u bazi ili kao print log za početak).

✅ 7. Public/Private ideje
Omogući korisnicima da biraju da li je njihova ideja javna ili privatna.

Privatne može videti samo autor (i admin),

Javne svi korisnici.

✅ 8. Frontend (ako ga još nema)
Ako koristiš samo backend, možemo postepeno praviti i jednostavni frontend u:

React,

ili čak u FastAPI pomoću Jinja2 šablona (za jednostavne prikaze).

Ako želiš, možemo zajedno implementirati neku od ovih funkcionalnosti – samo mi kaži šta bi ti najviše značilo da dodaš sada u projektu.
