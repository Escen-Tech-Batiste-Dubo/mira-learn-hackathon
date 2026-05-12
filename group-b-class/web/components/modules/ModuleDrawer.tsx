"use client";

import { type ChangeEvent, type SVGProps, useEffect, useMemo, useState } from "react";

import { useCreateModule, useUpdateModule } from "@/hooks/useModules";
import type { CreateModulePayload, Module, ModuleType, UpdateModulePayload } from "@/types/module";

type ModuleDrawerProps = {
  classId: string;
  module?: Module;
  nextPosition?: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ValidationErrors = {
  position: string | null;
  title: string | null;
  durationHours: string | null;
};

const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  theory: "Théorie",
  practice: "Pratique",
  exercise: "Exercice",
  discussion: "Discussion",
  workshop: "Atelier",
};

const DEFAULT_DURATION_HOURS = "1";
const DEFAULT_POSITION = "1";
const MAX_MODULES_PER_CLASS = 12;

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function getErrorMessage(isEditMode: boolean): string {
  return isEditMode
    ? "Hmm, on n'a pas reussi a enregistrer ce module. Reessaie ?"
    : "Hmm, on n'a pas reussi a creer ce module. Reessaie ?";
}

export function ModuleDrawer({
  classId,
  module,
  nextPosition,
  open,
  onClose,
  onSuccess,
}: ModuleDrawerProps) {
  const { createModule, isLoading: isCreating } = useCreateModule(classId);
  const { updateModule, isLoading: isUpdating } = useUpdateModule(classId);

  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ModuleType>("theory");
  const [durationHours, setDurationHours] = useState(DEFAULT_DURATION_HOURS);
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    position: null,
    title: null,
    durationHours: null,
  });
  const [apiError, setApiError] = useState<string | null>(null);

  const isEditMode = Boolean(module);
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!open) {
      return;
    }

    setPosition(module ? String(module.position) : String(nextPosition ?? 1));
    setTitle(module?.title ?? "");
    setType(module?.type ?? "theory");
    setDurationHours(module ? String(module.duration_hours) : DEFAULT_DURATION_HOURS);
    setDescription(module?.description ?? "");
    setValidationErrors({ position: null, title: null, durationHours: null });
    setApiError(null);
  }, [module, nextPosition, open]);

  const drawerTitle = useMemo(
    () => (isEditMode ? "Modifier le module" : "Ajouter un module"),
    [isEditMode],
  );

  const maxPosition = useMemo(() => {
    const candidate = isEditMode ? (nextPosition ?? 2) - 1 : (nextPosition ?? 1);
    return Math.min(MAX_MODULES_PER_CLASS, Math.max(1, candidate));
  }, [isEditMode, nextPosition]);

  const primaryLabel = useMemo(
    () => (isEditMode ? "Enregistrer" : "Créer"),
    [isEditMode],
  );

  function handlePositionChange(event: ChangeEvent<HTMLInputElement>): void {
    setPosition(event.target.value);
    setValidationErrors((current) => ({ ...current, position: null }));
    setApiError(null);
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>): void {
    setTitle(event.target.value);
    setValidationErrors((current) => ({ ...current, title: null }));
    setApiError(null);
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    setType(event.target.value as ModuleType);
    setApiError(null);
  }

  function handleDurationChange(event: ChangeEvent<HTMLInputElement>): void {
    setDurationHours(event.target.value);
    setValidationErrors((current) => ({ ...current, durationHours: null }));
    setApiError(null);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setDescription(event.target.value);
    setApiError(null);
  }

  async function handleSubmit(): Promise<void> {
    const parsedPosition = Number(position);
    const trimmedTitle = title.trim();
    const parsedDuration = Number(durationHours);
    const nextErrors: ValidationErrors = {
      position:
        Number.isInteger(parsedPosition) && parsedPosition >= 1 && parsedPosition <= maxPosition
          ? null
          : `Position invalide (1–${maxPosition})`,
      title: trimmedTitle ? null : "Le titre est requis",
      durationHours:
        Number.isFinite(parsedDuration) && parsedDuration >= 0.5 && parsedDuration <= 12
          ? null
          : "Durée invalide (0.5h – 12h)",
    };

    setValidationErrors(nextErrors);
    if (nextErrors.position || nextErrors.title || nextErrors.durationHours) {
      return;
    }

    setApiError(null);

    const descriptionValue = description.trim();

    try {
      if (module) {
        const payload: UpdateModulePayload = {
          ...(parsedPosition !== module.position ? { position: parsedPosition } : {}),
          ...(trimmedTitle !== module.title ? { title: trimmedTitle } : {}),
          ...(type !== module.type ? { type } : {}),
          ...(parsedDuration !== module.duration_hours ? { duration_hours: parsedDuration } : {}),
          ...(descriptionValue !== (module.description ?? "") ? { description: descriptionValue } : {}),
        };
        if (Object.keys(payload).length === 0) {
          onClose();
          return;
        }
        await updateModule(module.id, payload);
      } else {
        const payload: CreateModulePayload = {
          position: parsedPosition,
          title: trimmedTitle,
          type,
          duration_hours: parsedDuration,
          description: descriptionValue || undefined,
        };
        await createModule(payload);
      }

      onSuccess();
      onClose();
    } catch {
      setApiError(getErrorMessage(isEditMode));
    }
  }

  return (
    <>
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-[#1D1D1B]/40 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={isLoading ? undefined : onClose}
      />

      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-full w-[480px] max-w-full border-l border-[#E5E7EB] bg-white transition-transform duration-300 ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pb-6 pt-6">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1D1D1B]">{drawerTitle}</h2>
            </div>
            <button
              className="text-[#888888] transition-colors hover:text-[#1D1D1B]"
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {apiError ? (
              <div className="mb-4 rounded-lg border border-[#EF4444] bg-white p-3 text-sm text-[#EF4444]">
                {apiError}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D1D1B]" htmlFor="module-position">
                  Position
                </label>
                <input
                  id="module-position"
                  className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B] focus:border-[#E6332A] focus:outline-none focus:ring-1 focus:ring-[#E6332A]"
                  max={maxPosition}
                  min="1"
                  onChange={handlePositionChange}
                  step="1"
                  type="number"
                  value={position}
                />
                {validationErrors.position ? (
                  <p className="mt-1 text-xs text-[#EF4444]">{validationErrors.position}</p>
                ) : null}
                <p className="mt-1 text-xs text-[#888888]">
                  Modifie l'ordre de ce module dans la class
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D1D1B]" htmlFor="module-title">
                  Titre *
                </label>
                <input
                  id="module-title"
                  className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B] focus:border-[#E6332A] focus:outline-none focus:ring-1 focus:ring-[#E6332A]"
                  maxLength={200}
                  onChange={handleTitleChange}
                  type="text"
                  value={title}
                />
                {validationErrors.title ? (
                  <p className="mt-1 text-xs text-[#EF4444]">{validationErrors.title}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1D1D1B]" htmlFor="module-type">
                  Type *
                </label>
                <select
                  id="module-type"
                  className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B] focus:border-[#E6332A] focus:outline-none focus:ring-1 focus:ring-[#E6332A]"
                  onChange={handleTypeChange}
                  value={type}
                >
                  {Object.entries(MODULE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#1D1D1B]"
                  htmlFor="module-duration"
                >
                  Durée (heures) *
                </label>
                <input
                  id="module-duration"
                  className="h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[#1D1D1B] focus:border-[#E6332A] focus:outline-none focus:ring-1 focus:ring-[#E6332A]"
                  max="12"
                  min="0.5"
                  onChange={handleDurationChange}
                  step="0.5"
                  type="number"
                  value={durationHours}
                />
                {validationErrors.durationHours ? (
                  <p className="mt-1 text-xs text-[#EF4444]">{validationErrors.durationHours}</p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#1D1D1B]"
                  htmlFor="module-description"
                >
                  Description
                </label>
                <textarea
                  id="module-description"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[#1D1D1B] focus:border-[#E6332A] focus:outline-none focus:ring-1 focus:ring-[#E6332A]"
                  maxLength={4000}
                  onChange={handleDescriptionChange}
                  rows={4}
                  value={description}
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#E5E7EB] bg-white px-6 py-4">
            <button
              className="h-[44px] rounded-lg px-4 text-[#1D1D1B] transition-colors hover:bg-[#E2DCD3]"
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="flex h-[44px] items-center justify-center gap-2 rounded-lg bg-[#E6332A] px-4 text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {isLoading ? <Spinner /> : null}
              <span>{primaryLabel}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
