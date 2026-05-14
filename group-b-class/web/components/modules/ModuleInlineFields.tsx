"use client";

import { type FormEvent, useEffect, useState } from "react";

import { useUpdateModule } from "@/hooks/useModules";
import { ApiError } from "@/lib/api-client";
import type { Module, ModuleType } from "@/types/module";

const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  theory: "Théorie",
  practice: "Pratique",
  exercise: "Exercice",
  discussion: "Discussion",
  workshop: "Atelier",
};

type ModuleInlineFieldsProps = {
  classId: string;
  module: Module;
  onClose: () => void;
  onSaved: () => void;
  onSaveError?: (message: string) => void;
};

/** Édition inline (template-overview) : mini-form sous la ligne du module. */
export function ModuleInlineFields({
  classId,
  module,
  onClose,
  onSaved,
  onSaveError,
}: ModuleInlineFieldsProps) {
  const { updateModule, isLoading } = useUpdateModule(classId);
  const [title, setTitle] = useState(module.title);
  const [position, setPosition] = useState(String(module.position));
  const [description, setDescription] = useState(module.description ?? "");
  const [durationHours, setDurationHours] = useState(String(module.duration_hours));
  const [type, setType] = useState<ModuleType>(module.type);

  useEffect(() => {
    setTitle(module.title);
    setPosition(String(module.position));
    setDescription(module.description ?? "");
    setDurationHours(String(module.duration_hours));
    setType(module.type);
  }, [module.description, module.duration_hours, module.id, module.position, module.title, module.type]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const parsedPos = Number(position);
    const parsed = Number(durationHours);
    if (!trimmedTitle || !Number.isInteger(parsedPos) || parsedPos < 1) {
      return;
    }
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 12) {
      return;
    }
    try {
      await updateModule(module.id, {
        title: trimmedTitle,
        position: parsedPos,
        description: description.trim(),
        duration_hours: parsed,
        type,
      });
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Hmm, on n'a pas réussi à enregistrer les modifications. Réessaie ?";
      onSaveError?.(message);
    }
  }

  return (
    <form
      className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAF9] p-4"
      onSubmit={(ev) => void handleSubmit(ev)}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#888888]">
        Édition rapide
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]" htmlFor={`inline-title-${module.id}`}>
            Titre
          </label>
          <input
            id={`inline-title-${module.id}`}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-[#E6332A]"
            maxLength={200}
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]" htmlFor={`inline-pos-${module.id}`}>
            Position
          </label>
          <input
            id={`inline-pos-${module.id}`}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-[#E6332A]"
            min={1}
            step={1}
            type="number"
            value={position}
            onChange={(ev) => setPosition(ev.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]" htmlFor={`inline-dur-${module.id}`}>
            Durée (h)
          </label>
          <input
            id={`inline-dur-${module.id}`}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-[#E6332A]"
            max={12}
            min={0.5}
            step={0.5}
            type="number"
            value={durationHours}
            onChange={(ev) => setDurationHours(ev.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]" htmlFor={`inline-type-${module.id}`}>
            Type
          </label>
          <select
            id={`inline-type-${module.id}`}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-[#E6332A]"
            value={type}
            onChange={(ev) => setType(ev.target.value as ModuleType)}
          >
            {(Object.keys(MODULE_TYPE_LABELS) as ModuleType[]).map((value) => (
              <option key={value} value={value}>
                {MODULE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]" htmlFor={`inline-desc-${module.id}`}>
            Description
          </label>
          <textarea
            id={`inline-desc-${module.id}`}
            className="min-h-[72px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#E6332A]"
            maxLength={4000}
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="h-10 rounded-lg border border-[#B6B0A6] bg-white px-4 text-sm text-[#1D1D1B] hover:bg-[#E2DCD3]"
          disabled={isLoading}
          type="button"
          onClick={onClose}
        >
          Annuler
        </button>
        <button
          className="h-10 rounded-lg bg-[#E6332A] px-4 text-sm font-medium text-white disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
