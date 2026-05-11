"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, ApiError } from "@/lib/api-client";
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

function getFormatLabel(miraClass: MiraClass) {
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
          <span className="text-sm font-semibold text-[var(--primary)] transition-transform duration-300 group-hover:translate-x-1">Modules →</span>
        </div>
      </Link>
    </Card>
  );
}

export default function DashboardClassesPage() {
  const [classes, setClasses] = useState<MiraClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiClient
      .get<MiraClassListResponse>("/v1/classes/me")
      .then((payload) => {
        if (!mounted) {
          return;
        }
        setClasses(payload.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("On n'a pas réussi à charger tes Mira Classes.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const subtitle = useMemo(() => {
    if (classes.length === 0) {
      return "Structure tes parcours, puis ouvre des sessions concrètes aux apprenants.";
    }
    return `${classes.length} Mira Class${classes.length > 1 ? "es" : ""} dans ton backoffice mentor.`;
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
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Réessaie
          </Button>
        </Card>
      )}

      {!loading && !error && classes.length === 0 && (
        <Card className="py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-[var(--muted-foreground)] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold">Aucune Mira Class pour l'instant</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Commence par créer une class, puis ajoute tes modules, tes sessions et tes QCM.
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
