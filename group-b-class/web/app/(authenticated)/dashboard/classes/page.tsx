"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Globe2,
  MapPin,
  MonitorPlay,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, ApiError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
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

const SKILL_LABELS: Record<string, string> = {
  "11111111-0001-0000-0000-000000000001": "Pitch investor",
  "11111111-0001-0000-0000-000000000002": "Funding strategy",
  "11111111-0001-0000-0000-000000000003": "UI Design",
  "11111111-0001-0000-0000-000000000004": "Lean Canvas",
  "11111111-0001-0000-0000-000000000005": "Public speaking",
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

function getFormatIcon(miraClass: MiraClass) {
  if (miraClass.rythm_pattern === "self_paced") {
    return MonitorPlay;
  }
  if (miraClass.format_envisaged === "physical") {
    return MapPin;
  }
  if (miraClass.format_envisaged === "virtual") {
    return MonitorPlay;
  }
  return Globe2;
}

function getSkillLabel(skillId: string): string {
  return SKILL_LABELS[skillId] ?? "Skill";
}

function Badge({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--color-card)] px-3 text-xs font-semibold text-[var(--foreground)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: MiraClassStatus }) {
  const isPublished = status === "published";
  const isReady = status === "validated_draft" || status === "enrichment_in_progress";
  return (
    <Badge
      className={cn(
        isPublished && "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        isReady && "border-[var(--primary)] text-[var(--primary)]",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function FormatBadge({ miraClass }: { miraClass: MiraClass }) {
  const Icon = getFormatIcon(miraClass);
  return (
    <Badge>
      <Icon className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
      {getFormatLabel(miraClass)}
    </Badge>
  );
}

function HoursBadge({ miraClass }: { miraClass: MiraClass }) {
  return (
    <Badge>
      <Clock3 className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
      {miraClass.total_hours} h
    </Badge>
  );
}

function SkillBadges({ skillIds }: { skillIds: string[] }) {
  const visibleSkills = skillIds.slice(0, 3);
  const remainingCount = skillIds.length - visibleSkills.length;

  if (skillIds.length === 0) {
    return (
      <Badge>
        <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
        Skills à préciser
      </Badge>
    );
  }

  return (
    <>
      {visibleSkills.map((skillId) => (
        <Badge key={skillId} className="bg-[var(--background)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden="true" />
          {getSkillLabel(skillId)}
        </Badge>
      ))}
      {remainingCount > 0 && <Badge className="bg-[var(--background)]">+{remainingCount}</Badge>}
    </>
  );
}

function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--color-card)]"
        />
      ))}
    </div>
  );
}

function ClassCard({ miraClass, 
  onDelete,
  isDeleting
  } : { 
    miraClass: MiraClass;
    onDelete: (id: string) => void;
    isDeleting: boolean;
  }) {
  const description =
    miraClass.description.trim().length > 0
      ? miraClass.description
      : "Ajoute une description pour aider les apprenants à comprendre le parcours.";

  return (
    <Card className="p-0 relative group">

      <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
        <Link href={`/dashboard/classes/${miraClass.id}/edit`}>
          <button className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-full transition-all">
            <Pencil className="h-4 w-4" />
          </button>
        </Link>

        <button 
          onClick={(e) => { e.preventDefault(); onDelete(miraClass.id); }}
          disabled={isDeleting}
          className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      <Link
        href={`/dashboard/classes/${miraClass.id}/modules`}
        className="group block px-5 py-5 transition-all hover:bg-[var(--color-card)] sm:px-6"
      >
        <div className="flex flex-col gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={miraClass.status} />
              <FormatBadge miraClass={miraClass} />
              <HoursBadge miraClass={miraClass} />
            </div>

            <h2 className="mt-4 text-xl font-bold leading-snug">{miraClass.title}</h2>
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              {description}
            </p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <SkillBadges skillIds={miraClass.skills_taught} />
              </div>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette Mira Class ? Cette action est irréversible.")) {
      return;
    }

    setDeletingId(id);
    try {
      await apiClient.delete(`/v1/classes/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression. Vérifie tes permissions.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

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
          <h1 className="font-serif text-4xl font-bold italic leading-tight sm:text-5xl">
            Mes Mira Classes
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
            {subtitle}
          </p>
        </div>

        <Link href="/dashboard/classes/new">
          <Button className="flex items-center gap-2 px-6">
            <Plus className="h-4 w-4" />
            Créer une Mira Class
          </Button>
        </Link>
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
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold italic">Liste des classes</h2>
          </div>

          <div className="space-y-3">
            {classes.map((miraClass) => (
              <ClassCard 
                key={miraClass.id} 
                miraClass={miraClass} 
                onDelete={handleDelete}
                isDeleting={deletingId === miraClass.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
