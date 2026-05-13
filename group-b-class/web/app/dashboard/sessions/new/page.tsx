"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";

// ===== Strict Types =====
interface MiraClass {
  id: string;
  title: string;
  description: string | null;
  mentor_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MiraClassListResponse {
  items: MiraClass[];
  total: number;
}

interface CreateSessionPayload {
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_address?: string;
  location_city?: string;
  location_country?: string;
  online_meeting_provider?: string;
  online_meeting_default_url?: string;
  capacity: number;
  price_cents: number;
  starts_at: string;
  ends_at: string;
  waitlist_enabled: boolean;
  waitlist_max_size: number;
}

interface SessionResponse {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  status: string;
  created_at: string;
}

interface FormData {
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_address: string;
  location_city: string;
  location_country: string;
  online_meeting_provider: string;
  online_meeting_default_url: string;
  capacity: number;
  price_cents: number;
  starts_at: string;
  ends_at: string;
  waitlist_enabled: boolean;
  waitlist_max_size: number;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<MiraClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<"physical" | "virtual" | "hybrid">("virtual");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    class_id: "",
    type: "virtual",
    location_address: "",
    location_city: "",
    location_country: "",
    online_meeting_provider: "",
    online_meeting_default_url: "",
    capacity: 10,
    price_cents: 0,
    starts_at: "",
    ends_at: "",
    waitlist_enabled: true,
    waitlist_max_size: 20,
  });

  // Memoized fetch to avoid recreating on every render
  const fetchClasses = useCallback(async () => {
    try {
      setClassesLoading(true);
      setClassesError(null);
      const response = await apiClient.get<MiraClassListResponse>("/v1/classes/me");
      if (response && response.items && Array.isArray(response.items)) {
        setClasses(response.items);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setClassesError("Erreur lors du chargement des classes");
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  // Effect: Fetch classes when user is authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchClasses();
  }, [authLoading, user, router, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.class_id) {
      newErrors.class_id = "Veuillez sélectionner une classe";
    }
    if (formData.type !== "virtual" && !formData.location_address) {
      newErrors.location_address = "L'adresse est requise pour les sessions en présentiel";
    }
    if (!formData.starts_at) {
      newErrors.starts_at = "Date de début requise";
    }
    if (!formData.ends_at) {
      newErrors.ends_at = "Date de fin requise";
    }
    if (
      formData.type === "virtual" &&
      !formData.online_meeting_provider
    ) {
      newErrors.online_meeting_provider =
        "Le provider est requis";
    }
    if (
      formData.type === "virtual" &&
      !formData.online_meeting_default_url
    ) {
      newErrors.online_meeting_default_url =
        "Le lien de réunion est requis";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      const payload: CreateSessionPayload = {
        class_id: formData.class_id,
        type: formData.type,
        capacity: formData.capacity,
        price_cents: Math.floor(formData.price_cents * 100),
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        waitlist_enabled: formData.waitlist_enabled,
        waitlist_max_size: formData.waitlist_max_size,
      };

      if (formData.type !== "virtual") {
        payload.location_address = formData.location_address || undefined;
        payload.location_city = formData.location_city || undefined;
        payload.location_country = formData.location_country || undefined;
      }

      if (formData.type !== "physical") {
        payload.online_meeting_provider = formData.online_meeting_provider || undefined;
        payload.online_meeting_default_url = formData.online_meeting_default_url || undefined;
      }

      const response = await apiClient.post<SessionResponse>(
        `/v1/classes/${formData.class_id}/sessions`,
        payload
      );

      if (response && response.id) {
        router.push(`/dashboard/sessions/${response.id}`);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      setErrors({ submit: "Erreur lors de la création de la session" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center">Chargement de l'authentification...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créer une session</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Ajoutez une nouvelle session à l'une de vos classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la session</CardTitle>
          <CardDescription>
            Complétez les informations pour créer une session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Classe */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Classe</label>
              {classesLoading ? (
                <div className="flex h-11 items-center px-3 text-sm text-[var(--muted-foreground)]">
                  Chargement des classes...
                </div>
              ) : classesError ? (
                <div className="flex h-11 items-center px-3 text-sm text-red-500">
                  {classesError}
                </div>
              ) : (
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-base"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((cls: MiraClass) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title}
                    </option>
                  ))}
                </select>
              )}
              {errors.class_id && <p className="text-sm text-red-500">{errors.class_id}</p>}
            </div>

            {/* Type de session */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format de session</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as "physical" | "virtual" | "hybrid";
                  setFormData({ ...formData, type: newType });
                  setSelectedType(newType);
                }}
                className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-base"
              >
                <option value="virtual">En ligne (Zoom, Meet, etc.)</option>
                <option value="physical">En présentiel</option>
                <option value="hybrid">Hybride (présentiel + en ligne)</option>
              </select>
            </div>

            {/* Adresse (si physical/hybrid) */}
            {selectedType !== "virtual" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse</label>
                  <Input
                    placeholder="10 Rue de la Paix, Paris"
                    value={formData.location_address}
                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">Adresse complète du lieu</p>
                  {errors.location_address && (
                    <p className="text-sm text-red-500">{errors.location_address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ville</label>
                    <Input
                      placeholder="Paris"
                      value={formData.location_city}
                      onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pays</label>
                    <Input
                      placeholder="France"
                      value={formData.location_country}
                      onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
            {/* Champs online (si virtual/hybrid) */}

            {selectedType !== "physical" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Provider de visioconférence
                  </label>
                  <select
                    value={formData.online_meeting_provider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        online_meeting_provider: e.target.value,
                      })
                    }
                    className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-base"
                  >
                    <option value="">Sélectionner</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Autre</option>
                  </select>
                  {errors.online_meeting_provider && (
                    <p className="text-sm text-red-500">
                      {errors.online_meeting_provider}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Lien de réunion
                  </label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={formData.online_meeting_default_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        online_meeting_default_url: e.target.value,
                      })
                    }
                  />
                  {errors.online_meeting_default_url && (
                    <p className="text-sm text-red-500">
                      {errors.online_meeting_default_url}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Capacité */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacité maximale</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) })}
              />
              <p className="text-xs text-[var(--muted-foreground)]">Entre 1 et 50 participants</p>
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prix par participant (EUR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price_cents}
                onChange={(e) => setFormData({ ...formData, price_cents: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-[var(--muted-foreground)]">Laisser à 0 pour gratuit</p>
            </div>

            {/* Dates et heures */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Début</label>
                <Input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
                {errors.starts_at && <p className="text-sm text-red-500">{errors.starts_at}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fin</label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
                {errors.ends_at && <p className="text-sm text-red-500">{errors.ends_at}</p>}
              </div>
            </div>

            {/* Waitlist */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="waitlist"
                  checked={formData.waitlist_enabled}
                  onChange={(e) => setFormData({ ...formData, waitlist_enabled: e.target.checked })}
                />
                <label htmlFor="waitlist" className="text-sm font-medium cursor-pointer">
                  Activer la liste d'attente
                </label>
              </div>
            </div>

            {formData.waitlist_enabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Taille maximale liste d'attente</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.waitlist_max_size}
                  onChange={(e) =>
                    setFormData({ ...formData, waitlist_max_size: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            )}

            {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

            {/* Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer la session"}
              </Button>
              <Link href="/dashboard/sessions">
                <Button variant="outline">Annuler</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

