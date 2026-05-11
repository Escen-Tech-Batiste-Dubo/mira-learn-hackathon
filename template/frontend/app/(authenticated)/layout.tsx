"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

/**
 * Layout du groupe de routes `(authenticated)`.
 * Force l'authentification — redirige vers /login si pas de session.
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, l'auth check passe par un middleware Next.js qui inspecte
 *   le cookie cross-subdomain `hlmr_jwt` sur `.hello-mira.com`. Voir pattern
 *   `account-web/middleware.ts`. Pas besoin de check client-side.
 */
export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!user) {
    return null; // redirection en cours
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            Mira Learn
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/me" className="text-sm hover:underline">
              Mon profil
            </Link>
            <span className="text-sm text-gray-500">{user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Déconnexion
            </Button>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </>
  );
}
