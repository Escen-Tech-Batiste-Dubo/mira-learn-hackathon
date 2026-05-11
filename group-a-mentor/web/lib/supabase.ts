import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton client Supabase (browser).
 *
 * Convention hackathon (= book-web) : Supabase Auth via **localStorage**,
 * pas via @supabase/ssr avec cookies. La session est gérée client-side.
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, on conserve localStorage + on ajoute un cookie
 *   cross-subdomain `hlmr_jwt` sur `.hello-mira.com` pour partage SSO entre
 *   les apps (account.hello-mira.com, book.hello-mira.com, etc.).
 *   Le NEXT_PUBLIC_SUPABASE_URL devient `https://auth.hlmr.io` (custom domain).
 *   `cleanupLegacyCookies()` à ajouter si transition.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // En dev — affiché dans la console pour debug
  // En prod, validation au boot via Next.js env validation
  console.warn("Supabase env vars missing : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "hackathon-supabase-auth",
  },
});

/**
 * Récupère le JWT courant de la session Supabase (ou null si non authentifié).
 * Utilisé par `lib/api-client.ts` pour injecter le Bearer token automatiquement.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
