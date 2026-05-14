"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type SVGProps, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ModuleDrawer } from "@/components/modules/ModuleDrawer";
import { ModuleInlineFields } from "@/components/modules/ModuleInlineFields";
import { ModuleMaterialDrawer } from "@/components/modules/ModuleMaterialDrawer";
import { ModuleSortableList } from "@/components/modules/ModuleSortableList";
import {
  useDeleteModule,
  useModules,
  useReorderModules,
} from "@/hooks/useModules";
import { apiClient } from "@/lib/api-client";
import type { MiraClass, MiraClassStatus } from "@/types";
import type { Module, ModuleType } from "@/types/module";

type SessionOption = {
  id: string;
  starts_at: string;
  location_city?: string | null;
  location_country?: string | null;
};

type ToastState =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  theory: "Théorie",
  practice: "Pratique",
  exercise: "Exercice",
  discussion: "Discussion",
  workshop: "Atelier",
};

/** Libellés courts pour la ligne meta (statut Mira Class), alignés template-overview. */
const CLASS_STATUS_LABELS: Record<MiraClassStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  in_review: "En revue",
  validated_draft: "Validé (brouillon)",
  enrichment_in_progress: "Enrichissement",
  published: "Publié",
  rejected: "Refusé",
  archived: "Archivé",
};

function getErrorMessage(fallback: string): string {
  return fallback;
}

function formatDurationHours(durationHours: number | string): string {
  const parsedDurationHours = Number(durationHours);
  if (!Number.isFinite(parsedDurationHours)) {
    return "";
  }

  const formattedValue = parsedDurationHours.toFixed(1).replace(/\.0$/, "");

  return `${formattedValue}h`;
}

function GripVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  const className =
    toast.kind === "error"
      ? "fixed right-4 top-4 z-50 rounded-xl bg-[#EF4444] px-4 py-3 text-sm text-white"
      : "fixed right-4 top-4 z-50 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1D1D1B]";

  return <div className={className}>{toast.message}</div>;
}

export default function ModulesPage() {
  const params = useParams<{ id: string }>();
  const classId = typeof params.id === "string" ? params.id : "";

  const { modules, isLoading, error, mutate } = useModules(classId);
  const { reorderModules, isLoading: isReordering } = useReorderModules(classId);
  const { deleteModule, isLoading: isDeleting } = useDeleteModule(classId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [materialModule, setMaterialModule] = useState<Module | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [confirmingModuleId, setConfirmingModuleId] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<Module[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const [classDetail, setClassDetail] = useState<MiraClass | null>(null);
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({});

  const refetchMaterialCounts = useCallback(async () => {
    if (!classId) {
      return;
    }
    try {
      const data = await apiClient.get<{ counts: Record<string, number> }>(
        `/v1/classes/${classId}/module-material-counts`,
      );
      setMaterialCounts(data.counts ?? {});
    } catch {
      setMaterialCounts({});
    }
  }, [classId]);

  useEffect(() => {
    void refetchMaterialCounts();
  }, [refetchMaterialCounts]);

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  const sortedModules = useMemo(
    () => [...localModules].sort((left, right) => left.position - right.position),
    [localModules],
  );

  const quizCountByModuleId = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of sortedModules) {
      out[m.id] = m.quiz_count;
    }
    return out;
  }, [sortedModules]);

  useEffect(() => {
    if (!classId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const cls = await apiClient.get<MiraClass>(`/v1/classes/${classId}`);
        if (!cancelled) {
          setClassDetail(cls);
        }
      } catch {
        if (!cancelled) {
          setClassDetail(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      return;
    }
    let cancelled = false;
    setSessionsLoading(true);
    void (async () => {
      try {
        const list = await apiClient.get<SessionOption[]>(`/v1/classes/${classId}/sessions`);
        if (!cancelled) {
          setSessions(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) {
          setSessions([]);
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const hasReachedModuleLimit = modules.length >= 12;

  const classStatusLabel = classDetail
    ? CLASS_STATUS_LABELS[classDetail.status]
    : "…";

  const resourceCountByModuleId = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of sortedModules) {
      out[m.id] = materialCounts[m.id] ?? 0;
    }
    return out;
  }, [sortedModules, materialCounts]);

  const openCreateDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const toggleInlineEdit = useCallback((moduleId: string) => {
    setInlineEditId((current) => (current === moduleId ? null : moduleId));
  }, []);

  const openMaterialDrawer = useCallback((module: Module) => {
    setInlineEditId(null);
    setMaterialModule(module);
  }, []);

  const closeMaterialDrawer = useCallback(() => {
    setMaterialModule(null);
  }, []);

  const handleReorderFromDnd = useCallback(
    async (reordered: Module[]): Promise<void> => {
      const previous = sortedModules;
      setLocalModules(reordered);
      try {
        await reorderModules(reordered.map((m) => m.id));
        setToast({ kind: "success", message: "Ordre mis à jour" });
      } catch {
        setLocalModules(previous);
        mutate();
        setToast({
          kind: "error",
          message: getErrorMessage("Hmm, on n'a pas réussi à réordonner les modules. Réessaie ?"),
        });
      }
    },
    [mutate, reorderModules, sortedModules],
  );

  const handleDeleteModule = useCallback(
    async (moduleId: string): Promise<void> => {
      try {
        await deleteModule(moduleId);
        setLocalModules(
          sortedModules
            .filter((module) => module.id !== moduleId)
            .map((module, index) => ({
              ...module,
              position: index + 1,
            })),
        );
        setConfirmingModuleId(null);
        setToast({ kind: "success", message: "Module supprimé" });
      } catch {
        setToast({
          kind: "error",
          message: getErrorMessage("Hmm, on n'a pas réussi à supprimer ce module. Réessaie ?"),
        });
      }
    },
    [deleteModule, sortedModules],
  );

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-[#EFEAE5] font-[Manrope]">
      {toast ? <Toast toast={toast} /> : null}

      <div className="mx-auto max-w-4xl px-6 py-8">
        {classId ? (
          <Link
            href="/dashboard/classes"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-[#E6332A]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Retour aux classes
          </Link>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-bold text-[#1D1D1B]">
              Modules
            </h1>
            <p className="mt-2 text-sm text-[#888888]">
              Organise la progression pédagogique de ta Mira Class.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              className="h-[44px] rounded-lg bg-[#E6332A] px-4 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={hasReachedModuleLimit}
              onClick={openCreateDrawer}
              title={hasReachedModuleLimit ? "Maximum 12 modules atteint" : undefined}
              type="button"
            >
              + Nouveau module
            </button>
            {hasReachedModuleLimit ? (
              <p className="text-xs text-[#888888]">Maximum 12 modules atteint</p>
            ) : null}
          </div>
        </div>

        <div className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-[#E2DCD3]"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && error && sortedModules.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
              <p className="text-sm text-[#1D1D1B]">{getErrorMessage("Hmm, on n'a pas réussi à charger les modules.")}</p>
              <button
                className="mt-4 h-[44px] rounded-lg border border-[#B6B0A6] bg-white px-4 text-[#1D1D1B] hover:bg-[#E2DCD3]"
                onClick={mutate}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : null}

          {!isLoading && !error && sortedModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GripVerticalIcon className="h-12 w-12 text-[#888888]" />
              <h2 className="mt-4 text-base font-semibold text-[#1D1D1B]">
                Aucun module pour l&apos;instant.
              </h2>
              <p className="mt-2 text-xs text-[#888888]">
                Commence par ajouter ton premier module.
              </p>
              <button
                className="mt-6 h-[44px] rounded-lg bg-[#E6332A] px-4 text-white"
                onClick={openCreateDrawer}
                type="button"
              >
                + Nouveau module
              </button>
            </div>
          ) : null}

          {!isLoading && sortedModules.length > 0 ? (
            <ModuleSortableList
              classStatusLabel={classStatusLabel}
              disabled={isReordering}
              formatDurationHours={formatDurationHours}
              inlineEditOpenId={inlineEditId}
              moduleTypeLabels={MODULE_TYPE_LABELS}
              modules={sortedModules}
              onOpenMaterial={openMaterialDrawer}
              onReorder={handleReorderFromDnd}
              onToggleDeleteConfirm={(moduleId) =>
                setConfirmingModuleId((current) => (current === moduleId ? null : moduleId))
              }
              onToggleInlineEdit={toggleInlineEdit}
              quizCountByModuleId={quizCountByModuleId}
              renderAfterRow={(module) => (
                <ModuleInlineFields
                  classId={classId}
                  module={module}
                  onClose={() => setInlineEditId(null)}
                  onSaveError={(message) => setToast({ kind: "error", message })}
                  onSaved={() => {
                    setToast({ kind: "success", message: "Module mis à jour" });
                    void mutate();
                  }}
                />
              )}
              renderConfirmDelete={(module) =>
                confirmingModuleId === module.id ? (
                  <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAF9] p-4">
                    <p className="text-sm font-semibold text-[#1D1D1B]">
                      Supprimer ce module ?
                    </p>
                    <p className="mt-1 text-xs text-[#888888]">
                      Cette action retire le module de la liste actuelle.
                    </p>
                    <div className="mt-4 flex items-center justify-end gap-3">
                      <button
                        className="h-[44px] rounded-lg border border-[#B6B0A6] bg-white px-4 text-[#1D1D1B] hover:bg-[#E2DCD3]"
                        disabled={isReordering}
                        onClick={() => setConfirmingModuleId(null)}
                        type="button"
                      >
                        Annuler
                      </button>
                      <button
                        className="h-[44px] rounded-lg bg-[#E6332A] px-4 text-white"
                        disabled={isDeleting || isReordering}
                        onClick={() => void handleDeleteModule(module.id)}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : null
              }
              resourceCountByModuleId={resourceCountByModuleId}
            />
          ) : null}
        </div>
      </div>

      <ModuleDrawer
        classId={classId}
        nextPosition={sortedModules.length + 1}
        onClose={closeDrawer}
        onSuccess={mutate}
        open={drawerOpen}
      />

      <ModuleMaterialDrawer
        classId={classId}
        moduleId={materialModule?.id ?? ""}
        moduleTitle={materialModule?.title ?? ""}
        onClose={closeMaterialDrawer}
        onSaved={() => void refetchMaterialCounts()}
        open={materialModule !== null}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
      />
    </div>
  );
}
