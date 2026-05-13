"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";

// ===== Strict Types =====
interface Session {
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
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
  created_at: string;
  updated_at: string;
}

interface UpdateSessionPayload {
  type?: "physical" | "virtual" | "hybrid";
  location_address?: string;
  location_city?: string;
  location_country?: string;
  capacity?: number;
  starts_at?: string;
  ends_at?: string;
  enrolment_deadline?: string;
}

interface FormState {
  type: "physical" | "virtual" | "hybrid";
  location_address: string;
  location_city: string;
  location_country: string;
  capacity: number;
  starts_at: string;
  ends_at: string;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formState, setFormState] = useState<FormState>({
    type: "virtual",
    location_address: "",
    location_city: "",
    location_country: "",
    capacity: 10,
    starts_at: "",
    ends_at: "",
  });

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Session>(
        `/v1/classes/sessions/${sessionId}`
      );
      if (data) {
        setSession(data);
        setFormState({
          type: data.type,
          location_address: data.location_address || "",
          location_city: data.location_city || "",
          location_country: data.location_country || "",
          capacity: data.capacity,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
        });
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
      setError("Erreur lors du chargement de la session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (sessionId) {
      fetchSession();
    }
  }, [authLoading, user, sessionId, router, fetchSession]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formState.type !== "virtual" && !formState.location_address) {
      errors.location_address = "L'adresse est requise pour les sessions en présentiel";
    }
    if (!formState.starts_at) {
      errors.starts_at = "Date de début requise";
    }
    if (!formState.ends_at) {
      errors.ends_at = "Date de fin requise";
    }
    if (new Date(formState.ends_at) <= new Date(formState.starts_at)) {
      errors.ends_at = "La fin doit être après le début";
    }
    if (formState.capacity < 1 || formState.capacity > 50) {
      errors.capacity = "La capacité doit être entre 1 et 50";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload: UpdateSessionPayload = {
        type: formState.type,
        location_address: formState.location_address,
        location_city: formState.location_city,
        location_country: formState.location_country,
        capacity: formState.capacity,
        starts_at: formState.starts_at,
        ends_at: formState.ends_at,
      };

      const updatedSession = await apiClient.patch<Session>(
        `/v1/classes/sessions/${sessionId}`,
        payload
      );

      if (updatedSession) {
        setSession(updatedSession);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update session:", err);
      setError("Erreur lors de la mise à jour de la session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/v1/classes/sessions/${sessionId}`);
      router.push("/dashboard/sessions");
    } catch (err) {
      console.error("Failed to delete session:", err);
      setError("Erreur lors de la suppression de la session");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "outline" | "destructive" => {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planned: "default",
      open_enrolment: "secondary",
      full: "destructive",
      in_progress: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return colors[status] || "default";
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Session non trouvée</p>
        <Link href="/dashboard/sessions">
          <Button>← Retour aux sessions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détails de la session</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[var(--muted-foreground)]">Statut :</p>
            <Badge variant={getStatusColor(session.status)}>
              {session.status === "planned"
                ? "Planifiée"
                : session.status === "in_progress"
                ? "En cours"
                : session.status === "completed"
                ? "Terminée"
                : session.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sessions">
            <Button variant="outline">← Retour</Button>
          </Link>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Modifier</Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {isEditing ? (
        // EDIT MODE
        <Card>
          <CardHeader>
            <CardTitle>Modifier la session</CardTitle>
            <CardDescription>
              Modifiez les détails (uniquement si statut = Planifiée)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {session.status !== "planned" && (
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                ⚠️ Cette session ne peut pas être modifiée car elle n'est pas en
                statut "Planifiée".
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                value={formState.type}
                onChange={(e) => {
                  const newType = e.target.value as
                    | "physical"
                    | "virtual"
                    | "hybrid";
                  setFormState({ ...formState, type: newType });
                }}
                disabled={session.status !== "planned"}
                className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-base disabled:opacity-50"
              >
                <option value="virtual">En ligne</option>
                <option value="physical">Présentiel</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>

            {formState.type !== "virtual" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse</label>
                  <Input
                    placeholder="Adresse complète"
                    value={formState.location_address}
                    onChange={(e) =>
                      setFormState({ ...formState, location_address: e.target.value })
                    }
                    disabled={session.status !== "planned"}
                  />
                  {formErrors.location_address && (
                    <p className="text-sm text-red-500">
                      {formErrors.location_address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ville</label>
                    <Input
                      placeholder="Ville"
                      value={formState.location_city}
                      onChange={(e) =>
                        setFormState({ ...formState, location_city: e.target.value })
                      }
                      disabled={session.status !== "planned"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pays</label>
                    <Input
                      placeholder="Pays"
                      value={formState.location_country}
                      onChange={(e) =>
                        setFormState({ ...formState, location_country: e.target.value })
                      }
                      disabled={session.status !== "planned"}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Capacité</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formState.capacity}
                onChange={(e) =>
                  setFormState({ ...formState, capacity: parseInt(e.target.value, 10) })
                }
                disabled={session.status !== "planned"}
              />
              {formErrors.capacity && (
                <p className="text-sm text-red-500">{formErrors.capacity}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Début</label>
                <Input
                  type="datetime-local"
                  value={formState.starts_at}
                  onChange={(e) =>
                    setFormState({ ...formState, starts_at: e.target.value })
                  }
                  disabled={session.status !== "planned"}
                />
                {formErrors.starts_at && (
                  <p className="text-sm text-red-500">{formErrors.starts_at}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin</label>
                <Input
                  type="datetime-local"
                  value={formState.ends_at}
                  onChange={(e) =>
                    setFormState({ ...formState, ends_at: e.target.value })
                  }
                  disabled={session.status !== "planned"}
                />
                {formErrors.ends_at && (
                  <p className="text-sm text-red-500">{formErrors.ends_at}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t pt-6">
              <Button
                onClick={handleSave}
                disabled={isSaving || session.status !== "planned"}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // VIEW MODE
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">
                      Format
                    </p>
                    <p className="text-base">
                      {session.type === "physical"
                        ? "Présentiel"
                        : session.type === "virtual"
                        ? "En ligne"
                        : "Hybride"}
                    </p>
                  </div>

                  {session.type !== "virtual" && (
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Localisation
                      </p>
                      <p className="text-base">
                        {session.location_address}
                        <br />
                        {session.location_city} {session.location_country}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Début
                      </p>
                      <p className="text-base">{formatDate(session.starts_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Fin
                      </p>
                      <p className="text-base">{formatDate(session.ends_at)}</p>
                    </div>
                  </div>

                  {session.price_cents > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Prix par participant
                      </p>
                      <p className="text-base">
                        €{(session.price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inscriptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Capacité
                      </p>
                      <p className="text-2xl font-bold">{session.capacity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Inscrits
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          session.enrolment_count >= session.capacity
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {session.enrolment_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Waitlist
                      </p>
                      <p className="text-2xl font-bold">{session.waitlist_count}</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        session.enrolment_count >= session.capacity
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (session.enrolment_count / session.capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  ✏️ Modifier
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      🗑️ Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Supprimer la session ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement la session. Cette action
                      ne peut pas être annulée.
                    </AlertDialogDescription>
                    <div className="flex gap-2 justify-end">
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Suppression..." : "Supprimer"}
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="border-t pt-3">
                  <p className="text-xs text-[var(--muted-foreground)] font-medium">
                    Métadonnées
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    <strong>Créée :</strong> {formatDate(session.created_at)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    <strong>MàJ :</strong> {formatDate(session.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

