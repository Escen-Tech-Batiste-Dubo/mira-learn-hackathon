"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpenCheck, CalendarDays, CircleHelp, GraduationCap, LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type MiraUserMetadata = {
  role?: unknown;
  display_name?: unknown;
};

const NAV_ITEMS = [
  { href: "/dashboard/classes", label: "Mes classes", icon: BookOpenCheck },
  { href: "/dashboard/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/dashboard/learners", label: "Apprenants", icon: GraduationCap },
  { href: "/dashboard/quizzes", label: "QCM", icon: CircleHelp },
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
            src="/Logos/hmiraMeta.png"
            alt="Hello Mira"
            className="h-20 w-auto animate-pulse object-contain"
          />
          <p className="animate-pulse text-sm font-medium text-[var(--muted-foreground)]">
            Chargement de ton espace...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (role !== "mentor") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
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
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[268px_1fr]">
        <aside className="border-b border-[var(--border)] bg-[var(--color-card)] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-4 py-5">
            <Link href="/dashboard/classes" className="flex items-center px-2">
              <img
                src="/Logos/hmiraMeta.png"
                alt="Hello Mira"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <div className="mt-3 px-3">
              <p className="font-serif text-2xl font-bold italic leading-none text-[var(--foreground)]">
                Mentor
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                Dashboard
              </p>
            </div>

            <nav className="mt-7 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--muted-foreground)]",
                      "hover:bg-[var(--background)] hover:text-[var(--foreground)]",
                      active &&
                        "bg-[var(--background)] text-[var(--foreground)] ring-1 ring-[var(--border)]",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active && "text-[var(--primary)]")} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Mira Mentor</p>
              <Button variant="ghost" className="mt-3 w-full justify-start gap-2 px-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
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
