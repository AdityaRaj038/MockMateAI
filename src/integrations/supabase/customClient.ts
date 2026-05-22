import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabase as managedClient } from "./client";

const URL_KEY = "custom_supabase_url";
const ANON_KEY = "custom_supabase_anon_key";

let cached: SupabaseClient<Database> | null = null;
let cachedSig = "";

export function getCustomConfig() {
  if (typeof window === "undefined") return null;
  const url = localStorage.getItem(URL_KEY);
  const key = localStorage.getItem(ANON_KEY);
  if (url && key) return { url, key };
  return null;
}

export function setCustomConfig(url: string, key: string) {
  localStorage.setItem(URL_KEY, url);
  localStorage.setItem(ANON_KEY, key);
  cached = null;
  cachedSig = "";
}

export function clearCustomConfig() {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(ANON_KEY);
  cached = null;
  cachedSig = "";
}

export function isUsingCustomBackend() {
  return getCustomConfig() !== null;
}

/**
 * Returns the active Supabase client. If the user has configured a custom
 * backend via the Backend Settings page, returns a client pointing at it.
 * Otherwise returns the managed Lovable Cloud client.
 */
export function getSupabase(): SupabaseClient<Database> {
  const cfg = getCustomConfig();
  if (!cfg) return managedClient;
  const sig = cfg.url + "|" + cfg.key;
  if (cached && cachedSig === sig) return cached;
  cached = createClient<Database>(cfg.url, cfg.key, {
    auth: {
      storage: localStorage,
      storageKey: "custom-supabase-auth",
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  cachedSig = sig;
  return cached;
}
