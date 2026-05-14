"use client";

import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, type SVGProps, useMemo } from "react";

import type { Module, ModuleType } from "@/types/module";

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

function formatResourcePhrase(count: number): string {
  if (count <= 1) {
    return `${count} ressource`;
  }
  return `${count} ressources`;
}

function formatQuizPhrase(count: number): string {
  return `${count} QCM`;
}

export type ModuleSortableListProps = {
  modules: Module[];
  /** Libellé statut Mira Class (ligne meta, aligné template-overview). */
  classStatusLabel: string;
  /** 0 ou 1 QCM par module (`quiz_count` sur GET /v1/classes/:id/modules). */
  quizCountByModuleId: Record<string, number>;
  /** Compteur matériel ; pas d’API agrégée hackathon → 0 par défaut côté appelant. */
  resourceCountByModuleId: Record<string, number>;
  moduleTypeLabels: Record<ModuleType, string>;
  formatDurationHours: (h: number | string) => string;
  disabled?: boolean;
  onReorder: (reorderedModules: Module[]) => void | Promise<void>;
  /** Ligne secondaire sous les actions (ex. formulaire inline). */
  renderAfterRow?: (module: Module) => ReactNode;
  renderConfirmDelete?: (module: Module) => ReactNode;
  onToggleInlineEdit: (moduleId: string) => void;
  onOpenMaterial: (module: Module) => void;
  inlineEditOpenId: string | null;
  onToggleDeleteConfirm: (moduleId: string) => void;
};

type SortableRowProps = Omit<
  ModuleSortableListProps,
  "modules" | "onReorder" | "renderAfterRow" | "renderConfirmDelete"
> & {
  module: Module;
  renderAfterRow?: (module: Module) => ReactNode;
  renderConfirmDelete?: (module: Module) => ReactNode;
};

function SortableModuleRow({
  module,
  classStatusLabel,
  quizCountByModuleId,
  resourceCountByModuleId,
  moduleTypeLabels,
  formatDurationHours,
  disabled,
  onToggleInlineEdit,
  onOpenMaterial,
  inlineEditOpenId,
  onToggleDeleteConfirm,
  renderAfterRow,
  renderConfirmDelete,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const quizCount = quizCountByModuleId[module.id] ?? 0;
  const resourceCount = resourceCountByModuleId[module.id] ?? 0;
  const metaLine = [
    formatDurationHours(module.duration_hours),
    moduleTypeLabels[module.type],
    classStatusLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-[#E5E7EB] bg-white p-4 ${isDragging ? "z-10 shadow-md ring-1 ring-[#E6332A]/30" : ""}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          className="mt-0.5 flex h-10 w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-lg border border-transparent text-lg leading-none text-[#888888] hover:bg-[#E2DCD3] active:cursor-grabbing"
          aria-label={`Réordonner ${module.title}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="font-mono tracking-tighter">
            ≡
          </span>
        </button>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2DCD3] text-xs font-semibold text-[#1D1D1B]">
          {module.position}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1D1D1B]">{module.title}</p>
          <p className="mt-1 text-xs text-[#888888]">{metaLine}</p>
          <p className="mt-1 text-xs text-[#888888]">
            {formatQuizPhrase(quizCount)} · {formatResourcePhrase(resourceCount)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
            <button
              className="text-[#E6332A] underline-offset-2 hover:underline disabled:opacity-50"
              disabled={disabled}
              type="button"
              onClick={() => onToggleInlineEdit(module.id)}
            >
              Édit
            </button>
            <Link
              className="text-[#1D1D1B] underline-offset-2 hover:underline"
              href={`/dashboard/modules/${module.id}/quizzes/new?classId=${encodeURIComponent(module.class_id)}`}
            >
              Quiz
            </Link>
            <button
              className="text-[#1D1D1B] underline-offset-2 hover:underline disabled:opacity-50"
              disabled={disabled}
              type="button"
              onClick={() => onOpenMaterial(module)}
            >
              Matériel
            </button>
          </div>
        </div>

        <button
          aria-label={`Supprimer ${module.title}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#888888] hover:bg-[#E2DCD3] hover:text-[#EF4444]"
          disabled={disabled}
          onClick={() => onToggleDeleteConfirm(module.id)}
          type="button"
        >
          <Trash2Icon className="h-5 w-5" />
        </button>
      </div>

      {inlineEditOpenId === module.id ? renderAfterRow?.(module) : null}
      {renderConfirmDelete?.(module)}
    </div>
  );
}

export function ModuleSortableList({
  modules,
  classStatusLabel,
  quizCountByModuleId,
  resourceCountByModuleId,
  moduleTypeLabels,
  formatDurationHours,
  disabled,
  onReorder,
  renderAfterRow,
  renderConfirmDelete,
  onToggleInlineEdit,
  onOpenMaterial,
  inlineEditOpenId,
  onToggleDeleteConfirm,
}: ModuleSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const ids = useMemo(() => modules.map((m) => m.id), [modules]);

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const moved = arrayMove(modules, oldIndex, newIndex).map((m, index) => ({
      ...m,
      position: index + 1,
    }));
    await onReorder(moved);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {modules.map((module) => (
            <SortableModuleRow
              key={module.id}
              classStatusLabel={classStatusLabel}
              formatDurationHours={formatDurationHours}
              inlineEditOpenId={inlineEditOpenId}
              module={module}
              moduleTypeLabels={moduleTypeLabels}
              quizCountByModuleId={quizCountByModuleId}
              renderAfterRow={renderAfterRow}
              renderConfirmDelete={renderConfirmDelete}
              resourceCountByModuleId={resourceCountByModuleId}
              disabled={disabled}
              onOpenMaterial={onOpenMaterial}
              onToggleDeleteConfirm={onToggleDeleteConfirm}
              onToggleInlineEdit={onToggleInlineEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
