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

// Hasło administratora NIE przechodzi przez app_kv (patrz supabase-schema.sql) —
// porównanie hasła dzieje się po stronie bazy przez funkcje RPC, więc hash
// nigdy nie trafia do przeglądarki.
export const adminAuth = {
  async passwordExists() {
    const { data, error } = await supabase.rpc("admin_password_exists");
    if (error) throw error;
    return Boolean(data);
  },
  async setPassword(password) {
    const { error } = await supabase.rpc("set_admin_password", { new_password: password });
    if (error) throw error;
  },
  async verifyPassword(password) {
    const { data, error } = await supabase.rpc("verify_admin_password", { input_password: password });
    if (error) throw error;
    return Boolean(data);
  },
};
