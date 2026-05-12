"use client";

import { useParams } from "next/navigation";
import {
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useDeleteModule,
  useModules,
  useReorderModules,
} from "@/hooks/useModules";
import { ModuleDrawer } from "@/components/modules/ModuleDrawer";
import type { Module, ModuleType } from "@/types/module";

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

function reorderLocally(modules: Module[], fromIndex: number, toIndex: number): Module[] {
  const reordered = [...modules];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return reordered.map((module, index) => ({
    ...module,
    position: index + 1,
  }));
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

function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function Trash2Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="m6 9 6 6 6-6" />
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
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [confirmingModuleId, setConfirmingModuleId] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<Module[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

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

  const sortedModules = useMemo(
    () => [...localModules].sort((left, right) => left.position - right.position),
    [localModules],
  );
  const hasReachedModuleLimit = modules.length >= 12;

  const openCreateDrawer = useCallback(() => {
    setEditingModule(null);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((module: Module) => {
    setEditingModule(module);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingModule(null);
  }, []);

  const handleMoveModule = useCallback(
    async (moduleId: string, direction: "up" | "down"): Promise<void> => {
      const currentIndex = sortedModules.findIndex((module) => module.id === moduleId);
      if (currentIndex === -1) {
        return;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sortedModules.length) {
        return;
      }

      const previousModules = sortedModules;
      const reorderedModules = reorderLocally(sortedModules, currentIndex, targetIndex);
      setLocalModules(reorderedModules);

      try {
        await reorderModules(reorderedModules.map((module) => module.id));
        setToast({ kind: "success", message: "Ordre mis a jour" });
      } catch {
        setLocalModules(previousModules);
        mutate();
        setToast({
          kind: "error",
          message: getErrorMessage("Hmm, on n'a pas reussi a reordonner les modules. Reessaie ?"),
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
        setToast({ kind: "success", message: "Module supprime" });
      } catch {
        setToast({
          kind: "error",
          message: getErrorMessage("Hmm, on n'a pas reussi a supprimer ce module. Reessaie ?"),
        });
      }
    },
    [deleteModule, sortedModules],
  );

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-[#EFEAE5] font-[Manrope]">
      {toast ? <Toast toast={toast} /> : null}

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-bold text-[#1D1D1B]">
              Modules
            </h1>
            <p className="mt-2 text-sm text-[#888888]">
              Organise la progression pedagogique de ta Mira Class.
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
              + Ajouter
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
                  className="h-20 animate-pulse rounded-xl bg-[#E2DCD3]"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && error && sortedModules.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
              <p className="text-sm text-[#1D1D1B]">{getErrorMessage("Hmm, on n'a pas reussi a charger les modules.")}</p>
              <button
                className="mt-4 h-[44px] rounded-lg border border-[#B6B0A6] bg-white px-4 text-[#1D1D1B] hover:bg-[#E2DCD3]"
                onClick={mutate}
                type="button"
              >
                Reessayer
              </button>
            </div>
          ) : null}

          {!isLoading && !error && sortedModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GripVerticalIcon className="h-12 w-12 text-[#888888]" />
              <h2 className="mt-4 text-base font-semibold text-[#1D1D1B]">
                Aucun module pour l'instant.
              </h2>
              <p className="mt-2 text-xs text-[#888888]">
                Commence par ajouter ton premier module.
              </p>
              <button
                className="mt-6 h-[44px] rounded-lg bg-[#E6332A] px-4 text-white"
                onClick={openCreateDrawer}
                type="button"
              >
                + Ajouter un module
              </button>
            </div>
          ) : null}

          {!isLoading && sortedModules.length > 0 ? (
            <div className="space-y-4">
              {sortedModules.map((module, index) => (
                <div
                  key={module.id}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVerticalIcon className="h-5 w-5 cursor-grab text-[#B6B0A6]" />
                      <div className="flex flex-col gap-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1D1D1B] hover:bg-[#E2DCD3]"
                          disabled={index === 0 || isReordering}
                          onClick={() => void handleMoveModule(module.id, "up")}
                          type="button"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1D1D1B] hover:bg-[#E2DCD3]"
                          disabled={index === sortedModules.length - 1 || isReordering}
                          onClick={() => void handleMoveModule(module.id, "down")}
                          type="button"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E2DCD3] text-xs font-medium text-[#1D1D1B]">
                      {module.position}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1D1D1B]">
                          {module.title}
                        </p>
                        <span className="rounded-full bg-[#E2DCD3] px-3 py-1 text-xs text-[#1D1D1B]">
                          {MODULE_TYPE_LABELS[module.type]}
                        </span>
                        <span className="text-xs text-[#888888]">
                          {formatDurationHours(module.duration_hours)}
                        </span>
                      </div>
                    </div>

                    <button
                      aria-label={`Modifier ${module.title}`}
                      className="flex h-[44px] w-[44px] items-center justify-center text-[#E6332A] hover:bg-[#E2DCD3]"
                      disabled={isReordering}
                      onClick={() => openEditDrawer(module)}
                      type="button"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      aria-label={`Supprimer ${module.title}`}
                      className="flex h-[44px] w-[44px] items-center justify-center text-[#888888] hover:bg-[#E2DCD3] hover:text-[#EF4444]"
                      disabled={isReordering}
                      onClick={() =>
                        setConfirmingModuleId((current) =>
                          current === module.id ? null : module.id,
                        )
                      }
                      type="button"
                    >
                      <Trash2Icon className="h-5 w-5" />
                    </button>
                  </div>

                  {confirmingModuleId === module.id ? (
                    <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
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
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <ModuleDrawer
        classId={classId}
        module={editingModule ?? undefined}
        nextPosition={sortedModules.length + 1}
        onClose={closeDrawer}
        onSuccess={mutate}
        open={drawerOpen}
      />
    </div>
  );
}
