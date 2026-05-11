import Link from "next/link";

/**
 * Layout backoffice mentor — navigation minimale (tokens Mira via globals.css).
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0 border-t border-[var(--border)] bg-[var(--color-background)]">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--color-card)] p-4 md:block">
        <p className="font-serif text-lg font-bold text-[var(--color-foreground)]">Mira Class</p>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/me" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            Profil
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-6">{children}</div>
    </div>
  );
}
