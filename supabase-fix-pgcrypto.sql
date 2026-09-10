-- Poprawka: pgcrypto w Supabase domyślnie instaluje się w schemacie "extensions",
-- a nie "public", więc funkcje crypt()/gen_salt() trzeba wołać z pełną nazwą
-- schematu i dodać "extensions" do search_path funkcji. Uruchom to jednorazowo —
-- bezpiecznie nadpisuje tylko funkcje związane z hasłem, nic więcej nie rusza.

create extension if not exists pgcrypto with schema extensions;

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
