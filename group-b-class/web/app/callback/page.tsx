"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

/**
 * Page de callback Supabase OAuth.
 *
 * Si tu utilises Supabase OAuth providers (Google, etc.), le redirect URL pointe
 * ici. La session est récupérée puis tu rediriges l'utilisateur vers son dashboard.
 *
 * Pour le hackathon : optionnel (le login email/password n'a pas besoin de callback).
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, le callback passe par `idp-front` qui gère le redirect_token,
 *   pas directement par les apps. Ce fichier devient une simple redirection vers IDP.
 */
export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase capture automatiquement la session depuis l'URL hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/me");
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>Connexion en cours...</p>
    </main>
  );
}
