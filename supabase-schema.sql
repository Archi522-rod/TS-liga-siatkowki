-- Liga Siatkówki — schemat Supabase
-- Wklej całość w Supabase Dashboard → SQL Editor → uruchom (Run).

-- 1) Uniwersalny magazyn klucz-wartość — zastępuje dawne window.storage z Claude Artifacts.
--    Przechowuje: listę sezonów, drużyny/mecze/hale dla każdego sezonu, aktualny sezon.
--    Te dane są jawnie publiczne (każdy odwiedzający widzi tabelę i terminarz),
--    więc odczyt i zapis jest otwarty dla wszystkich odwiedzających stronę.
create table if not exists app_kv (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table app_kv enable row level security;

create policy "app_kv public select"
  on app_kv for select
  using (true);

create policy "app_kv public insert"
  on app_kv for insert
  with check (true);

create policy "app_kv public update"
  on app_kv for update
  using (true)
  with check (true);

create policy "app_kv public delete"
  on app_kv for delete
  using (true);

-- 2) Hasło administratora — NIGDY nie trzymamy go w app_kv (byłoby czytelne dla każdego
--    przez klucz publiczny anon). Zamiast tego: osobna tabela bez żadnych publicznych
--    polityk (czyli całkowicie niedostępna z przeglądarki) + funkcje SECURITY DEFINER,
--    które robią porównanie hasła po stronie bazy i zwracają tylko true/false.
create extension if not exists pgcrypto with schema extensions;

create table if not exists app_admin (
  id boolean primary key default true check (id),
  password_hash text
);

alter table app_admin enable row level security;
-- Celowo: brak jakichkolwiek "create policy" na app_admin => tabela niedostępna
-- bezpośrednio z klucza anon. Dostęp wyłącznie przez funkcje poniżej.

create or replace function admin_password_exists()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from app_admin where password_hash is not null);
$$;

create or replace function set_admin_password(new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if exists (select 1 from app_admin where password_hash is not null) then
    raise exception 'Hasło administratora już istnieje.';
  end if;
  insert into app_admin (id, password_hash)
  values (true, extensions.crypt(new_password, extensions.gen_salt('bf')))
  on conflict (id) do update set password_hash = excluded.password_hash;
end;
$$;

create or replace function verify_admin_password(input_password text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from app_admin
    where password_hash = extensions.crypt(input_password, password_hash)
  );
$$;

grant execute on function admin_password_exists() to anon, authenticated;
grant execute on function set_admin_password(text) to anon, authenticated;
grant execute on function verify_admin_password(text) to anon, authenticated;

-- Gotowe. Hasło jest teraz hashowane (bcrypt) i nigdy nie opuszcza bazy danych —
-- to bezpieczniejsze niż poprzedni model w Claude Artifacts, gdzie hasło leżało
-- jawnym tekstem w tym samym magazynie co reszta danych.
