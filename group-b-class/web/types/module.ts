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
}

export interface CreateModulePayload {
  title: string;
  description?: string;
  type: ModuleType;
  duration_hours: number;
  ai_generated?: boolean;
}

export interface UpdateModulePayload {
  title?: string;
  description?: string;
  type?: ModuleType;
  duration_hours?: number;
}

export interface ReorderPayload {
  modules: Array<{ id: string; position: number }>;
}
