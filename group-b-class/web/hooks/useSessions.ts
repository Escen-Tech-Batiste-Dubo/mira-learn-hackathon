import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface Session {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_address?: string;
  location_city?: string;
  location_country?: string;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
  enrolment_deadline?: string;
  is_promoted: boolean;
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
  created_at: string;
  updated_at: string;
}

export function useSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/v1/sessions/${sessionId}`);
      if (response.status === "success" && response.data) {
        setSession(response.data);
      }
    } catch (err) {
      setError("Erreur lors du chargement de la session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { session, loading, error, fetch };
}

export function useSessions(classId?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "/v1/me/sessions";
      if (classId) {
        url = `/v1/classes/${classId}/sessions`;
      }

      const response = await apiClient.get(url);
      if (response.status === "success" && Array.isArray(response.data)) {
        setSessions(response.data);
      }
    } catch (err) {
      setError("Erreur lors du chargement des sessions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  return { sessions, loading, error, fetch };
}

export function useCreateSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (classId: string, data: any) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.post(`/v1/classes/${classId}/sessions`, data);
        if (response.status === "success") {
          return response.data;
        }
        throw new Error(response.message || "Erreur lors de la création");
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Erreur lors de la création de la session";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { create, loading, error };
}

export function useUpdateSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (sessionId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.patch(`/v1/sessions/${sessionId}`, data);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Erreur lors de la mise à jour");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la mise à jour de la session";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useDeleteSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_session = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.delete(`/v1/sessions/${sessionId}`);
      if (response.status === "success") {
        return true;
      }
      throw new Error(response.message || "Erreur lors de la suppression");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la suppression de la session";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { delete_session, loading, error };
}

