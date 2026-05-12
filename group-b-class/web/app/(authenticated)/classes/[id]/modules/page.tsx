"use client";

import { useParams } from "next/navigation";
import {
  type FormEvent,
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useCreateModule,
  useDeleteModule,
  useModules,
  useReorderModules,
  useUpdateModule,
} from "@/hooks/useModules";
import type {
  CreateModulePayload,
  Module,
  ModuleType,
  ReorderPayload,
  UpdateModulePayload,
} from "@/types/module";

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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function reorderLocally(modules: Module[], fromIndex: number, toIndex: number): Module[] {
  const reordered = [...modules];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return reordered.map((module, index) => ({
    ...module,
    position: index,
  }));
}

function buildReorderPayload(modules: Module[]): ReorderPayload {
  return {
    modules: modules.map((module, index) => ({
      id: module.id,
      position: index,
    })),
  };
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

type ModuleDrawerProps = {
  open: boolean;
  module: Module | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateModulePayload | UpdateModulePayload) => Promise<void>;
};

function ModuleDrawer({ open, module, isLoading, onClose, onSubmit }: ModuleDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ModuleType>("theory");
  const [durationHours, setDurationHours] = useState("1");

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(module?.title ?? "");
    setDescription(module?.description ?? "");
    setType(module?.type ?? "theory");
    setDurationHours(module ? String(module.duration_hours) : "1");
  }, [module, open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const nextDurationHours = Number(durationHours);
    const payload = {
      title: trimmedTitle,
      description: description.trim() ? description.trim() : "",
      type,
      duration_hours: nextDurationHours,
    };

    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-black/20">
      <button
        aria-label="Fermer"
        className="flex-1 cursor-default"
        onClick={onClose}
        type="button"
      />
      <aside className="w-full max-w-md border-l border-[#E5E7EB] bg-white p-6 font-[Manrope]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[Playfair_Display] text-2xl font-bold text-[#1D1D1B]">
              {module ? "Modifier le module" : "Ajouter un module"}
            </h2>
            <p className="mt-2 text-sm text-[#888888]">
              {module
                ? "Mets a jour le titre, la duree et le type de ce module."
                : "Ajoute le premier contenu pedagogique de ta Mira Class."}
            </p>
          </div>
          <button
            className="h-[44px] rounded-lg border border-[#B6B0A6] bg-white px-4 text-[#1D1D1B]"
            onClick={onClose}
            type="button"
          >
            Fermer
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1D1D1B]">Titre</span>
            <input
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B]"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1D1D1B]">Type</span>
            <select
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B]"
              onChange={(event) => setType(event.target.value as ModuleType)}
              value={type}
            >
              {Object.entries(MODULE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1D1D1B]">
              Duree (heures)
            </span>
            <input
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B]"
              max="12"
              min="0.1"
              onChange={(event) => setDurationHours(event.target.value)}
              required
              step="0.1"
              type="number"
              value={durationHours}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#1D1D1B]">Description</span>
            <textarea
              className="min-h-[140px] w-full rounded-xl border border-[#E5E7EB] bg-white p-4 text-[#1D1D1B]"
              maxLength={4000}
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              className="h-[44px] rounded-lg border border-[#B6B0A6] bg-white px-4 text-[#1D1D1B]"
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="h-[44px] rounded-lg bg-[#E6332A] px-4 text-white"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Enregistrement..." : module ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default function ModulesPage() {
  const params = useParams<{ id: string }>();
  const classId = typeof params.id === "string" ? params.id : "";

  const { modules, isLoading, error, mutate } = useModules(classId);
  const { createModule, isLoading: isCreating } = useCreateModule(classId);
  const { updateModule, isLoading: isUpdating } = useUpdateModule(classId);
  const { reorderModules, isLoading: isReordering } = useReorderModules(classId);
  const { deleteModule, isLoading: isDeleting } = useDeleteModule(classId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [confirmingModuleId, setConfirmingModuleId] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<Module[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  const isDrawerSubmitting = isCreating || isUpdating;

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

  const handleDrawerSubmit = useCallback(
    async (payload: CreateModulePayload | UpdateModulePayload): Promise<void> => {
      try {
        if (editingModule) {
          await updateModule(editingModule.id, payload as UpdateModulePayload);
        } else {
          await createModule(payload as CreateModulePayload);
        }
        closeDrawer();
      } catch (submitError: unknown) {
        setToast({
          kind: "error",
          message: getErrorMessage(
            submitError,
            "Hmm, on n'a pas reussi a enregistrer ce module. Reessaie ?",
          ),
        });
        throw submitError;
      }
    },
    [closeDrawer, createModule, editingModule, updateModule],
  );

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
        await reorderModules(buildReorderPayload(reorderedModules));
        setToast({ kind: "success", message: "Ordre mis a jour" });
      } catch (reorderError: unknown) {
        setLocalModules(previousModules);
        mutate();
        setToast({
          kind: "error",
          message: getErrorMessage(
            reorderError,
            "Hmm, on n'a pas reussi a reordonner les modules. Reessaie ?",
          ),
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
              position: index,
            })),
        );
        setConfirmingModuleId(null);
        setToast({ kind: "success", message: "Module supprime" });
      } catch (deleteError: unknown) {
        setToast({
          kind: "error",
          message: getErrorMessage(
            deleteError,
            "Hmm, on n'a pas reussi a supprimer ce module. Reessaie ?",
          ),
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

          <button
            className="h-[44px] rounded-lg bg-[#E6332A] px-4 text-white"
            onClick={openCreateDrawer}
            type="button"
          >
            + Ajouter
          </button>
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
              <p className="text-sm text-[#1D1D1B]">
                {getErrorMessage(error, "Hmm, on n'a pas reussi a charger les modules.")}
              </p>
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
                      {module.position + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1D1D1B]">
                          {module.title}
                        </p>
                        <span className="rounded-full bg-[#E2DCD3] px-3 py-1 text-xs text-[#1D1D1B]">
                          {MODULE_TYPE_LABELS[module.type]}
                        </span>
                        <span className="text-xs text-[#888888]">{module.duration_hours}h</span>
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
        isLoading={isDrawerSubmitting}
        module={editingModule}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        open={drawerOpen}
      />
    </div>
  );
}
