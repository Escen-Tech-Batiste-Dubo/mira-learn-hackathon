"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import type { MiraClass, MiraClassListResponse, MiraClassStatus } from "@/types";

const STATUS_LABELS: Record<MiraClassStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumise",
  in_review: "En revue",
  validated_draft: "Validée",
  enrichment_in_progress: "En préparation",
  published: "Publiée",
  rejected: "Refusée",
  archived: "Archivée",
};

const FORMAT_LABELS: Record<MiraClass["format_envisaged"], string> = {
  physical: "Présentiel",
  virtual: "Live virtuel",
  both: "Hybride",
};

function getFormatLabel(miraClass: MiraClass): string {
  if (miraClass.rythm_pattern === "self_paced") {
    return "Async";
  }
  return FORMAT_LABELS[miraClass.format_envisaged];
}

function StatusBadge({ status }: { status: MiraClassStatus }) {
  return (
    <span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)]">
      {STATUS_LABELS[status]}
    </span>
  );
}

function ClassesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--color-card)]"
        />
      ))}
    </div>
  );
}

function ClassCard({ miraClass }: { miraClass: MiraClass }) {
  const description =
    miraClass.description.trim().length > 0
      ? miraClass.description
      : "Ajoute une description pour aider les apprenants à comprendre le parcours.";

  return (
    <Card className="p-0">
      <Link
        href={`/dashboard/classes/${miraClass.id}/modules`}
        className="group block px-5 py-4 transition-all hover:bg-[var(--background)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">{miraClass.title}</h2>
              <StatusBadge status={miraClass.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--muted-foreground)]">
              <span>{getFormatLabel(miraClass)}</span>
              <span aria-hidden="true">·</span>
              <span>{miraClass.total_hours} h prévues</span>
              <span aria-hidden="true">·</span>
              <span>{miraClass.skills_taught.length} skill(s)</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-[var(--primary)] transition-transform duration-300 group-hover:translate-x-1">
            Modules →
          </span>
        </div>
      </Link>
    </Card>
  );
}

export default function DashboardClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<MiraClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadClasses() {
      setLoading(true);
      try {
        const payload = await apiClient.get<MiraClassListResponse>("/v1/classes/me");
        if (!mounted) {
          return;
        }
        setClasses(payload.items);
        setError(null);
        setErrorStatus(null);
      } catch (err: unknown) {
        if (!mounted) {
          return;
        }
        setClasses([]);

        if (err instanceof ApiError && err.status === 401) {
          await supabase.auth.signOut();
          if (mounted) {
            router.replace("/login");
          }
          return;
        }

        if (err instanceof ApiError && err.status === 403) {
          setError("Ton compte n'a pas accès à cet espace mentor.");
          setErrorStatus(err.status);
        } else if (err instanceof ApiError) {
          setError(err.message);
          setErrorStatus(err.status);
        } else if (err instanceof Error) {
          setError(err.message);
          setErrorStatus(null);
        } else {
          setError("On n'a pas réussi à charger tes Mira Classes.");
          setErrorStatus(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadClasses();

    return () => {
      mounted = false;
    };
  }, [reloadNonce, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const subtitle = useMemo(() => {
    if (classes.length === 0) {
      return "Structure tes parcours, puis ouvre des sessions concrètes aux apprenants.";
    }
    if (classes.length === 1) {
      return "1 Mira Class dans ton backoffice mentor.";
    }
    return `${classes.length} Mira Classes dans ton backoffice mentor.`;
  }, [classes.length]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">Backoffice mentor</p>
          <h1 className="mt-1 text-3xl font-bold">Mes Mira Classes</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">{subtitle}</p>
        </div>
      </header>

      {loading && <ClassesSkeleton />}

      {!loading && error && (
        <Card>
          <h2 className="text-lg font-semibold">Hmm, chargement impossible</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{error}</p>
          {errorStatus === 403 ? (
            <Button className="mt-4" onClick={handleSignOut}>
              Changer de compte
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => setReloadNonce((value) => value + 1)}>
              Réessaie
            </Button>
          )}
        </Card>
      )}

      {!loading && !error && classes.length === 0 && (
        <Card className="py-16 text-center">
          <BookOpenCheck className="mx-auto h-12 w-12 text-[var(--muted-foreground)] opacity-60" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">Aucune Mira Class pour l'instant</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Dès qu'une class est validée pour ton profil mentor, elle apparaît ici.
          </p>
        </Card>
      )}

      {!loading && !error && classes.length > 0 && (
        <div className="space-y-3">
          {classes.map((miraClass) => (
            <ClassCard key={miraClass.id} miraClass={miraClass} />
          ))}
        </div>
      )}
    </div>
  );
}
