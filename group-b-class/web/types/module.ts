export type ModuleType =
  | "theory"
  | "practice"
  | "exercise"
  | "discussion"
  | "workshop";

export interface Module {
  id: string;
  class_id: string;
  position: number;
  title: string;
  description: string | null;
  type: ModuleType;
  duration_hours: number;
  ai_generated: boolean;
  source_outline_id: string | null;
  created_at: string;
  updated_at: string;
  /** Nombre de QCM actifs (API : 0 ou 1 en MVP). */
  quiz_count: number;
}

export interface CreateModulePayload {
  position: number;
  title: string;
  description?: string;
  type: ModuleType;
  duration_hours: number;
  ai_generated?: boolean;
}

export interface UpdateModulePayload {
  position?: number;
  title?: string;
  description?: string;
  type?: ModuleType;
  duration_hours?: number;
}

export interface ReorderPayload {
  module_ids_in_order: string[];
}
