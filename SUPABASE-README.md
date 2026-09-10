# Podpięcie Supabase — Liga Siatkówki

Od tej wersji aplikacja **nie działa już jako artefakt w Claude.ai** — korzysta z
prawdziwej bazy danych w chmurze (Supabase), więc wymaga własnego builda (Vite,
Create React App, Next.js itp.) i hostingu (np. Vercel, Netlify, własny serwer).

## 1. Załóż projekt Supabase
1. Wejdź na [supabase.com](https://supabase.com) → "New project" (darmowy plan wystarczy).
2. Poczekaj aż projekt się utworzy (ok. 1–2 minuty).

## 2. Wgraj schemat bazy
1. W panelu projektu: **SQL Editor** → **New query**.
2. Wklej całą zawartość pliku `supabase-schema.sql` i kliknij **Run**.
3. To utworzy: tabelę `app_kv` (drużyny, mecze, hale, sezony — dane publiczne)
   oraz bezpieczny mechanizm hasła administratora (tabela `app_admin` + funkcje,
   hasło jest hashowane i nigdy nie trafia do przeglądarki).

## 3. Pobierz klucze API
W panelu: **Project Settings → API**. Skopiuj:
- **Project URL**
- **anon public key** (NIE `service_role` — ten musi zostać sekretem po stronie serwera)

## 4. Skonfiguruj projekt frontendowy
1. Zainstaluj zależność:
   ```
   npm install @supabase/supabase-js
   ```
2. Skopiuj `lib/storage.js` do swojego projektu (np. `src/lib/storage.js`) —
   dopasuj ścieżkę importu w `liga_siatkowki.jsx`, jeśli trzymasz plik gdzie indziej.
3. Utwórz plik `.env` w katalogu głównym (na podstawie `.env.example`):
   ```
   VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=twoj-anon-key
   ```
   (Nazwy zmiennych z prefiksem `VITE_` działają w projektach Vite. Jeśli używasz
   Create React App, zmień prefiks na `REACT_APP_` i odpowiednio w `lib/storage.js`
   zamień `import.meta.env.VITE_...` na `process.env.REACT_APP_...`.)
4. **Nigdy nie commituj pliku `.env`** do repozytorium — dodaj go do `.gitignore`.
   Na hostingu (Vercel/Netlify) ustaw te same zmienne w panelu "Environment Variables".

## 5. Pierwsze uruchomienie
- Otwórz aplikację — pierwsza osoba, która wejdzie w zakładkę **Admin**, ustawi
  hasło administratora (tak jak wcześniej). Od tej pory hasło jest zahashowane
  (bcrypt) i przechowywane w tabeli `app_admin`, do której przeglądarka nie ma
  bezpośredniego dostępu — weryfikacja idzie przez funkcję w bazie.
- Drużyny, mecze, hale i sezony są teraz widoczne dla **wszystkich odwiedzających
  w czasie rzeczywistym** (współdzielona baza), dokładnie tak jak działało to
  wcześniej w Claude Artifacts.

## Co się zmieniło względem wersji z Claude Artifacts
- `window.storage` → zastąpione przez `storage` (patrz `lib/storage.js`), które
  łączy się z tabelą `app_kv` w Supabase zamiast z pamięcią Claude.
- Hasło administratora: dawniej leżało jawnym tekstem w tym samym magazynie co
  reszta danych. Teraz jest hashowane i sprawdzane po stronie bazy — to
  realne zabezpieczenie, a nie tylko "security by obscurity".
- Reszta logiki aplikacji (tabela, terminarz, generator kolejek, protokoły,
  plakat) działa bez zmian.

## Bezpieczeństwo — o czym warto pamiętać
- Klucz `anon` jest publiczny (widoczny w kodzie frontendu) — to normalne w
  Supabase, dopóki reguły RLS (Row Level Security) ograniczają, co można nim
  zrobić. W `supabase-schema.sql` dane ligowe (`app_kv`) są celowo w pełni
  publiczne do odczytu i zapisu, bo to zgodne z charakterem strony (każdy,
  kto zna hasło administratora, edytuje terminarz — tak jak wcześniej).
- Jeśli w przyszłości chcecie, żeby tylko zalogowany administrator mógł
  zapisywać zmiany (a nie każdy, kto zna adres API), to naturalny kolejny krok
  to włączenie **Supabase Auth** i zawężenie polityk RLS do `authenticated`
  zamiast `true`. Mogę to przygotować, jeśli zechcecie pójść w tę stronę.
