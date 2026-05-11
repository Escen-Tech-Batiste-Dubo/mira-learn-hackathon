"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type MiraUserMetadata = {
  role?: unknown;
  display_name?: unknown;
};

const NAV_ITEMS = [
  { href: "/dashboard/classes", label: "Mes classes" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/learners", label: "Apprenants" },
  { href: "/dashboard/quizzes", label: "QCM" },
] as const;

function readMetadata(...values: Array<unknown>): MiraUserMetadata {
  const merged: MiraUserMetadata = {};
  for (const value of values) {
    if (value && typeof value === "object") {
      Object.assign(merged, value as MiraUserMetadata);
    }
  }
  return merged;
}

function readDisplayMetadata(value: unknown): MiraUserMetadata {
  if (value && typeof value === "object") {
    return value as MiraUserMetadata;
  }
  return {};
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const metadata = readMetadata(user?.user_metadata, user?.app_metadata);
  const displayMetadata = readDisplayMetadata(user?.user_metadata);
  const role = typeof metadata.role === "string" ? metadata.role : null;
  const displayName =
    typeof displayMetadata.display_name === "string" ? displayMetadata.display_name : user?.email;

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-6">
          <img 
            src="https://www.hello-mira.com/Logos/hmiraMeta.png" 
            alt="Hello Mira" 
            className="h-20 w-auto animate-pulse object-contain drop-shadow-lg"
          />
          <p className="animate-pulse text-sm font-medium text-[var(--muted-foreground)]">Chargement de ton espace...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (role !== "mentor") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--color-card)] p-6 text-center">
          <h1 className="text-xl font-semibold">Accès réservé aux Mira Mentors</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Connecte-toi avec un compte mentor pour gérer tes Mira Classes.
          </p>
          <Button className="mt-6" onClick={handleSignOut}>
            Changer de compte
          </Button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--border)] bg-[var(--color-card)] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-4 py-5">
            <Link href="/dashboard/classes" className="flex items-baseline gap-2 px-2">
              <span className="font-serif text-2xl font-bold">Mira</span>
              <span className="text-xs font-semibold tracking-wide text-[var(--primary)]">
                LEARN
              </span>
            </Link>

            <nav className="mt-8 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)]",
                      "hover:bg-[var(--background)] hover:text-[var(--foreground)]",
                      active &&
                        "bg-[var(--background)] text-[var(--foreground)] ring-1 ring-[var(--border)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Mira Mentor</p>
              <Button variant="ghost" className="mt-3 w-full justify-start px-2" onClick={handleSignOut}>
                Déconnexion
              </Button>
            </div>
          </div>
        </aside>

        <main className="px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
