"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type {
  CreateModulePayload,
  Module,
  UpdateModulePayload,
} from "@/types/module";

type ApiModule = Omit<Module, "duration_hours"> & {
  duration_hours: number | string;
};

type ModulesResponse = {
  modules: ApiModule[];
};

type ModuleResponse = {
  module: ApiModule;
};

type Revalidator = () => void;

const moduleRevalidators = new Map<string, Set<Revalidator>>();

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function registerRevalidator(classId: string, revalidator: Revalidator): () => void {
  const listeners = moduleRevalidators.get(classId) ?? new Set<Revalidator>();
  listeners.add(revalidator);
  moduleRevalidators.set(classId, listeners);

  return () => {
    const current = moduleRevalidators.get(classId);
    if (!current) {
      return;
    }

    current.delete(revalidator);
    if (current.size === 0) {
      moduleRevalidators.delete(classId);
    }
  };
}

function notifyModulesChanged(classId: string): void {
  const listeners = moduleRevalidators.get(classId);
  if (!listeners) {
    return;
  }

  for (const revalidator of listeners) {
    revalidator();
  }
}

function getModulesPath(classId: string): string {
  return `/v1/classes/${encodePathSegment(classId)}/modules`;
}

function getModulePath(classId: string, moduleId: string): string {
  return `/v1/classes/${encodePathSegment(classId)}/modules/${encodePathSegment(moduleId)}`;
}

function normalizeModule(module: ApiModule): Module {
  const durationHours = Number(module.duration_hours);
  if (!Number.isFinite(durationHours)) {
    throw new Error("Invalid module duration");
  }

  return {
    ...module,
    duration_hours: durationHours,
  };
}

export function useModules(
  classId: string,
): { modules: Module[]; isLoading: boolean; error: unknown; mutate: () => void } {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const requestIdRef = useRef(0);

  const loadModules = useCallback(async (): Promise<void> => {
    if (!classId) {
      requestIdRef.current += 1;
      setModules([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    try {
      const data = await apiClient.get<ModulesResponse>(getModulesPath(classId));
      if (requestId !== requestIdRef.current) {
        return;
      }
      setModules(
        data.modules
          .map(normalizeModule)
          .sort((left, right) => left.position - right.position),
      );
      setError(null);
    } catch (nextError: unknown) {
      if (requestId === requestIdRef.current) {
        setError(nextError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [classId]);

  const mutate = useCallback((): void => {
    void loadModules().catch(() => undefined);
  }, [loadModules]);

  useEffect(() => {
    setModules([]);
    mutate();
    if (!classId) {
      return;
    }

    return registerRevalidator(classId, mutate);
  }, [classId, mutate]);

  return { modules, isLoading, error, mutate };
}

export function useCreateModule(
  classId: string,
): {
  createModule: (payload: CreateModulePayload) => Promise<Module>;
  isLoading: boolean;
} {
  const [pendingCount, setPendingCount] = useState(0);

  const createModule = useCallback(
    async (payload: CreateModulePayload): Promise<Module> => {
      setPendingCount((current) => current + 1);
      try {
        const data = await apiClient.post<ModuleResponse>(getModulesPath(classId), payload);
        notifyModulesChanged(classId);
        return normalizeModule(data.module);
      } finally {
        setPendingCount((current) => Math.max(0, current - 1));
      }
    },
    [classId],
  );

  return { createModule, isLoading: pendingCount > 0 };
}

export function useUpdateModule(
  classId: string,
): {
  updateModule: (moduleId: string, payload: UpdateModulePayload) => Promise<Module>;
  isLoading: boolean;
} {
  const [pendingCount, setPendingCount] = useState(0);

  const updateModule = useCallback(
    async (moduleId: string, payload: UpdateModulePayload): Promise<Module> => {
      setPendingCount((current) => current + 1);
      try {
        const data = await apiClient.patch<ModuleResponse>(
          getModulePath(classId, moduleId),
          payload,
        );
        notifyModulesChanged(classId);
        return normalizeModule(data.module);
      } finally {
        setPendingCount((current) => Math.max(0, current - 1));
      }
    },
    [classId],
  );

  return { updateModule, isLoading: pendingCount > 0 };
}

export function useReorderModules(
  classId: string,
): {
  reorderModules: (orderedIds: string[]) => Promise<Module[]>;
  isLoading: boolean;
} {
  const [pendingCount, setPendingCount] = useState(0);

  const reorderModules = useCallback(
    async (orderedIds: string[]): Promise<Module[]> => {
      setPendingCount((current) => current + 1);
      try {
        const data = await apiClient.patch<ModulesResponse>(
          `${getModulesPath(classId)}/reorder`,
          { module_ids_in_order: orderedIds },
        );
        notifyModulesChanged(classId);
        return data.modules.map(normalizeModule);
      } finally {
        setPendingCount((current) => Math.max(0, current - 1));
      }
    },
    [classId],
  );

  return { reorderModules, isLoading: pendingCount > 0 };
}

export function useDeleteModule(
  classId: string,
): {
  deleteModule: (moduleId: string) => Promise<void>;
  isLoading: boolean;
} {
  const [pendingCount, setPendingCount] = useState(0);

  const deleteModule = useCallback(
    async (moduleId: string): Promise<void> => {
      setPendingCount((current) => current + 1);
      try {
        await apiClient.delete<Record<string, never>>(getModulePath(classId, moduleId));
        notifyModulesChanged(classId);
      } finally {
        setPendingCount((current) => Math.max(0, current - 1));
      }
    },
    [classId],
  );

  return { deleteModule, isLoading: pendingCount > 0 };
}
