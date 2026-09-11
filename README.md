# Liga Siatkówki — wdrożenie krok po kroku

Ten folder to gotowy projekt (Vite + React), połączony z Supabase. Poniżej
pełna ścieżka: od zera do działającej strony pod własnym adresem, z automatycznym
HTTPS i możliwością instalacji jako aplikacja (PWA). 

Zakładam, że nie masz jeszcze konta na żadnej z tych usług — jeśli coś już masz,
po prostu pomiń dany krok.

---

## Krok 0 — czego potrzebujesz

- **Node.js** (do uruchomienia projektu lokalnie) — [nodejs.org](https://nodejs.org), wersja LTS.
- Konto **GitHub** (darmowe) — [github.com](https://github.com).
- Konto **Vercel** (darmowe, logujesz się przez GitHub) — [vercel.com](https://vercel.com).
- Konto **Supabase** (darmowe) — [supabase.com](https://supabase.com).

Sprawdź, czy Node jest zainstalowany, wpisując w terminalu:
```
node -v
```
Powinno pokazać coś jak `v18.x` lub `v20.x`. Jeśli błąd — zainstaluj Node ze strony wyżej.

---

## Krok 1 — załóż bazę danych w Supabase

1. Wejdź na [supabase.com](https://supabase.com) → **Start your project** → zaloguj się (np. przez GitHub).
2. **New project** → wybierz nazwę (np. `liga-siatkowki`), ustaw hasło do bazy (zapisz je gdzieś, nie będzie potrzebne do samej appki, ale dobrze je mieć), region najbliższy Polsce (np. Frankfurt/EU), plan **Free**.
3. Poczekaj ok. 1-2 minuty, aż projekt się utworzy.
4. W lewym menu: **SQL Editor** → **New query**.
5. Otwórz plik `supabase-schema.sql` z tego projektu, skopiuj całą zawartość, wklej do edytora SQL w Supabase i kliknij **Run**.
   - Powinno pokazać "Success. No rows returned" — to oznacza, że tabele i funkcje zostały utworzone.
6. W lewym menu: **Project Settings** (ikona zębatki na dole) → **API**.
   - Skopiuj **Project URL** (wygląda jak `https://xxxxx.supabase.co`).
   - Skopiuj klucz **anon public** (długi ciąg znaków). **Nie** kopiuj `service_role` — ten musi zostać sekretem.

---

## Krok 2 — skonfiguruj projekt lokalnie

1. Rozpakuj ten folder projektu na dysku i wejdź do niego w terminalu:
   ```
   cd liga-siatkowki-app
   ```
2. Skopiuj plik `.env.example` do `.env`:
   ```
   cp .env.example .env
   ```
   (Na Windows w PowerShell: `copy .env.example .env`)
3. Otwórz `.env` w dowolnym edytorze i wklej dane z Supabase (Krok 1, punkt 6):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=twoj-anon-key
   ```
4. Zainstaluj zależności:
   ```
   npm install
   ```
5. Uruchom lokalnie, żeby sprawdzić, czy wszystko działa:
   ```
   npm run dev
   ```
   Terminal pokaże adres, zwykle `http://localhost:5173` — otwórz go w przeglądarce.
   Wejdź w zakładkę **Admin** i ustaw hasło administratora — to jednorazowa czynność,
   od teraz to hasło działa na każdym urządzeniu (jest w Supabase, nie lokalnie).

Jeśli strona się wczytała i możesz dodać drużynę w panelu Admin — wszystko działa.
Zatrzymaj serwer testowy (Ctrl+C w terminalu) i przejdź dalej.

---

## Krok 3 — wrzuć kod na GitHub

1. Na [github.com](https://github.com) → **New repository** → nazwij np. `liga-siatkowki` → **Create repository** (zostaw je puste, bez README).
2. W terminalu, w folderze projektu:
   ```
   git init
   git add .
   git commit -m "Liga Siatkówki - pierwsza wersja"
   git branch -M main
   git remote add origin https://github.com/TWOJA-NAZWA/liga-siatkowki.git
   git push -u origin main
   ```
   (Adres z `git remote add origin` znajdziesz na stronie repozytorium, które właśnie utworzyłeś na GitHub — GitHub pokazuje go od razu po utworzeniu.)
   Plik `.env` **nie** zostanie wysłany na GitHub (jest w `.gitignore`) — to celowe, bo zawiera dane, które i tak wpiszesz osobno na Vercelu.

---

## Krok 4 — wdróż na Vercel

1. Wejdź na [vercel.com](https://vercel.com) → zaloguj się przez GitHub.
2. **Add New... → Project**.
3. Znajdź i wybierz repozytorium `liga-siatkowki` → **Import**.
4. Vercel sam wykryje, że to projekt Vite — nic nie musisz zmieniać w ustawieniach builda.
5. Rozwiń **Environment Variables** i dodaj dokładnie te same dwie zmienne co w `.env`:
   - `VITE_SUPABASE_URL` → Twój Project URL
   - `VITE_SUPABASE_ANON_KEY` → Twój anon key
6. Kliknij **Deploy**. Po ok. minucie dostaniesz link typu `https://liga-siatkowki.vercel.app` — strona już działa, na prawdziwym HTTPS.

Każda kolejna zmiana: wprowadź ją lokalnie, potem
```
git add .
git commit -m "opis zmiany"
git push
```
— Vercel sam zbuduje i wystawi nową wersję w ciągu ok. minuty.

---

## Krok 5 — sprawdź PWA na telefonie

1. Otwórz link Vercela na telefonie (Chrome na Androidzie lub Safari na iOS).
2. **Android/Chrome**: powinien pojawić się baner "Dodaj do ekranu głównego" — albo w menu (⋮) wybierz "Zainstaluj aplikację".
3. **iOS/Safari**: dotknij ikony "Udostępnij" → **Dodaj do ekranu początkowego** (Apple nie pokazuje automatycznego banera).
4. Po dodaniu, ikona z Waszym logo pojawi się na ekranie głównym telefonu i otworzy się jak natywna aplikacja (bez paska adresu przeglądarki).

---

## Krok 6 (opcjonalnie) — własna domena

Jeśli macie domenę (np. `ligasiatkowki-wagrowiec.pl`):
1. W panelu Vercel: **Project → Settings → Domains** → wpisz swoją domenę.
2. Vercel pokaże, jaki rekord DNS dodać (zwykle `CNAME` lub `A`) — dodajesz go u dostawcy domeny.
3. Po propagacji DNS (od kilku minut do kilku godzin) strona będzie dostępna pod własnym adresem, nadal z automatycznym HTTPS.

---

## Coś nie działa?

- **"Nie udało się zapisać hasła" / błędy zapisu w Admin** — sprawdź, czy zmienne
  `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` są poprawnie wpisane (bez spacji,
  bez cudzysłowów) i czy plik `supabase-schema.sql` faktycznie został uruchomiony
  w Supabase (Krok 1, punkt 5).
- **Strona działa lokalnie, ale nie na Vercelu** — najczęściej brak zmiennych
  środowiskowych na Vercelu (Krok 4, punkt 5) albo literówka w nazwie zmiennej.
- **Dane admina "znikają" po odświeżeniu** — to by oznaczało, że appka nadal
  gdzieś odwołuje się do starego `window.storage` zamiast do Supabase; daj znać,
  sprawdzimy razem kod.
