"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSession, useUpdateSession, useDeleteSession } from "@/hooks/useSessions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { session, loading: sessionLoading, fetch: fetchSession } = useSession(sessionId);
  const { update, loading: updateLoading } = useUpdateSession();
  const { delete_session, loading: deleteLoading } = useDeleteSession();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (!sessionId) return;
    fetchSession();
  }, [user, authLoading, sessionId, router, fetchSession]);

  const handleDelete = async () => {
    try {
      await delete_session(sessionId);
      router.push("/dashboard/sessions");
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planned: "default",
      open_enrolment: "secondary",
      full: "destructive",
      in_progress: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      physical: "Présentiel",
      virtual: "En ligne",
      hybrid: "Hybride",
    };
    return types[type] || type;
  };

  if (authLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (sessionLoading) {
    return <div className="p-8 text-center">Chargement de la session...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Session non trouvée</p>
        <Link href="/dashboard/sessions">
          <Button>Retour aux sessions</Button>
        </Link>
      </div>
    );
  }

  const isAtCapacity = session.enrolment_count >= session.capacity;
  const isFull = session.status === "full" || isAtCapacity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détails de la session</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">Session</p>
            {getStatusBadge(session.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/sessions">← Retour</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. La session sera supprimée définitivement.
              </AlertDialogDescription>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Format</p>
                <p className="text-base">{getTypeDisplay(session.type)}</p>
              </div>

              {/* Location */}
              {session.type !== "virtual" && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localisation</p>
                  <p className="text-base">
                    {session.location_address}
                    <br />
                    {session.location_city} {session.location_country}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Début</p>
                  <p className="text-base">
                    {format(new Date(session.starts_at), "dd MMM yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fin</p>
                  <p className="text-base">
                    {format(new Date(session.ends_at), "dd MMM yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              {/* Price */}
              {session.price_cents > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prix par participant</p>
                  <p className="text-base">€{(session.price_cents / 100).toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Inscriptions</CardTitle>
              <CardDescription>
                État actuel des inscriptions et liste d'attente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacité</p>
                  <p className="text-2xl font-bold">{session.capacity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inscrits</p>
                  <p className={`text-2xl font-bold ${isFull ? "text-destructive" : ""}`}>
                    {session.enrolment_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waitlist</p>
                  <p className="text-2xl font-bold">{session.waitlist_count}</p>
                </div>
              </div>

              {isFull && (
                <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  ⚠️ Session pleine — Les nouveaux inscrits seront ajoutés à la liste d'attente
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>{session.enrolment_count} inscrits</span>
                  <span>{session.capacity} places</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isFull ? "bg-red-500" : "bg-green-500"}`}
                    style={{
                      width: `${Math.min((session.enrolment_count / session.capacity) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Taux d'occupation</p>
              <p className="text-3xl font-bold">
                {Math.round((session.enrolment_count / session.capacity) * 100)}%
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Places restantes</p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.max(0, session.capacity - session.enrolment_count)}
              </p>
            </div>

            {session.waitlist_count > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">En attente</p>
                <p className="text-3xl font-bold text-orange-600">{session.waitlist_count}</p>
              </div>
            )}

            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Métadonnées</p>
              <div className="text-xs space-y-1">
                <p>
                  <strong>Créée:</strong> {format(new Date(session.created_at), "dd MMM yyyy", { locale: fr })}
                </p>
                <p>
                  <strong>MàJ:</strong> {format(new Date(session.updated_at), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

