import { createClient } from "@supabase/supabase-js";

// Ustaw te wartości w pliku .env (patrz SUPABASE-README.md):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Adapter zgodny z dawnym interfejsem window.storage (Claude Artifacts), żeby
// reszta aplikacji potrzebowała minimalnych zmian. Wszystkie dane w tej appce
// są "shared" (publiczne dla każdego odwiedzającego), więc nie ma tu pojęcia
// danych prywatnych per-użytkownik — jeden wspólny magazyn klucz-wartość w Supabase.
export const storage = {
  async get(key) {
    const { data, error } = await supabase
      .from("app_kv")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("not_found");
    return { key, value: data.value };
  },

  async set(key, value) {
    const { error } = await supabase
      .from("app_kv")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { key, value };
  },

  async delete(key) {
    const { error } = await supabase.from("app_kv").delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true };
  },

  async list(prefix = "") {
    const { data, error } = await supabase
      .from("app_kv")
      .select("key")
      .like("key", `${prefix}%`);
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key) };
  },
};

// Hasła administratorów NIE przechodzą przez app_kv (patrz supabase-schema-admin-accounts.sql) —
// logowanie/zarządzanie kontami dzieje się po stronie bazy przez funkcje RPC, więc
// hash nigdy nie trafia do przeglądarki. Każde konto ma własny login i hasło;
// zarządzanie kolejnymi kontami (dodawanie/usuwanie) wymaga podania danych już
// zalogowanej osoby (actor), którą baza sama weryfikuje przy każdym wywołaniu.
export const adminAuth = {
  // Czy istnieje choć jedno konto admina (decyduje, czy pokazać ekran "utwórz pierwsze konto").
  async accountsExist() {
    const { data, error } = await supabase.rpc("admin_accounts_exist");
    if (error) throw error;
    return Boolean(data);
  },
  // Zakłada pierwsze konto — działa tylko dopóki tabela kont jest pusta.
  async bootstrapAccount(username, password) {
    const { error } = await supabase.rpc("bootstrap_admin_account", {
      new_username: username,
      new_password: password,
    });
    if (error) throw error;
  },
  // Sprawdza login + hasło przy wejściu do panelu.
  async login(username, password) {
    const { data, error } = await supabase.rpc("verify_admin_login", {
      p_username: username,
      p_password: password,
    });
    if (error) throw error;
    return Boolean(data);
  },
  // Lista loginów (bez haseł) — wymaga podania danych już zalogowanej osoby.
  async listAccounts(actorUsername, actorPassword) {
    const { data, error } = await supabase.rpc("list_admin_accounts", {
      actor_username: actorUsername,
      actor_password: actorPassword,
    });
    if (error) throw error;
    return data || [];
  },
  // Dodaje nowe konto administratora.
  async addAccount(actorUsername, actorPassword, newUsername, newPassword) {
    const { error } = await supabase.rpc("add_admin_account", {
      actor_username: actorUsername,
      actor_password: actorPassword,
      new_username: newUsername,
      new_password: newPassword,
    });
    if (error) throw error;
  },
  // Usuwa konto administratora (baza nie pozwoli usunąć ostatniego pozostałego).
  async removeAccount(actorUsername, actorPassword, targetUsername) {
    const { error } = await supabase.rpc("remove_admin_account", {
      actor_username: actorUsername,
      actor_password: actorPassword,
      target_username: targetUsername,
    });
    if (error) throw error;
  },
  // Zmiana własnego hasła przez zalogowaną osobę.
  async changePassword(actorUsername, actorPassword, newPassword) {
    const { error } = await supabase.rpc("change_admin_password", {
      actor_username: actorUsername,
      actor_password: actorPassword,
      new_password: newPassword,
    });
    if (error) throw error;
  },
};

// Statystyki odwiedzin. Zapisywane są wyłącznie: anonimowy losowy ID przeglądarki,
// nazwa zakładki i typ urządzenia (bez IP, bez danych osobowych).
// Odczyt możliwy tylko przez funkcję RPC po weryfikacji loginu admina.
const VISITOR_KEY = "vb_visitor_id";

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (e) {
    return null; // brak localStorage — nie liczymy takiej wizyty
  }
}

export const analytics = {
  // Zapisuje wejście na zakładkę. Błędy są ignorowane — statystyki nie mogą psuć strony.
  async track(tab) {
    try {
      const visitorId = getVisitorId();
      if (!visitorId) return;
      const device = window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
      await supabase.from("page_views").insert({ visitor_id: visitorId, tab, device });
    } catch (e) { /* ignoruj */ }
  },
  async getStats(actorUsername, actorPassword) {
    const { data, error } = await supabase.rpc("get_visit_stats", {
      p_username: actorUsername,
      p_password: actorPassword,
    });
    if (error) throw error;
    return data;
  },
};
