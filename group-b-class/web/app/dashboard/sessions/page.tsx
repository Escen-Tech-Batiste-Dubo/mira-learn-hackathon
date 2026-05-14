"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";

// ===== Strict Types =====
interface Session {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_city?: string;
  location_country?: string;
  location_address?: string;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
  created_at: string;
  updated_at: string;
}

interface SessionListResponse {
  items?: Session[];
  data?: Session[];
}

export default function SessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionList = await apiClient.get<SessionListResponse>("/v1/me/sessions");
      if (Array.isArray(sessionList)) {
        setSessions(sessionList);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setError("Erreur lors du chargement des sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchSessions();
  }, [authLoading, user, router, fetchSessions]);

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

  const getStatusBadge = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planned: "default",
      open_enrolment: "secondary",
      full: "destructive",
      in_progress: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return variants[status] || "default";
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      physical: "📍",
      virtual: "🌐",
      hybrid: "🔗",
    };
    return icons[type] || "📌";
  };

  const formatLocation = (session: Session): string => {
    if (session.type === "virtual") return "En ligne";
    const parts = [];
    if (session.location_city) parts.push(session.location_city);
    if (session.location_country) parts.push(session.location_country);
    return parts.length > 0 ? parts.join(", ") : "À définir";
  };

  if (authLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Gérez toutes vos sessions de cours
          </p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button>+ Nouvelle session</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-[var(--muted-foreground)]">Chargement des sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-[var(--muted-foreground)] mb-4">Aucune session créée</p>
            <Link href="/dashboard/sessions/new">
              <Button>Créer la première session</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des sessions ({sessions.length})</CardTitle>
            <CardDescription>
              Cliquez sur "Gérer" pour modifier ou supprimer une session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Format</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-right">Capacité</TableHead>
                  <TableHead className="text-right">Inscrits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: Session) => (
                  <TableRow key={session.id} className="hover:bg-[var(--background)]">
                    <TableCell className="font-medium">
                      <span className="mr-2">{getTypeIcon(session.type)}</span>
                      {session.type === "physical" ? "Présentiel" : session.type === "virtual" ? "En ligne" : "Hybride"}
                    </TableCell>
                    <TableCell>{formatLocation(session)}</TableCell>
                    <TableCell className="text-sm">{formatDate(session.starts_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(session.ends_at)}</TableCell>
                    <TableCell className="text-right font-medium">{session.capacity}</TableCell>
                    <TableCell className="text-right">
                      <span className={session.enrolment_count >= session.capacity ? "text-red-600 font-semibold" : ""}>
                        {session.enrolment_count}/{session.capacity}
                      </span>
                      {session.waitlist_count > 0 && (
                        <span className="text-xs text-[var(--muted-foreground)] block">
                          +{session.waitlist_count} en attente
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(session.status)}>
                        {session.status === "planned" ? "Planifiée"
                         : session.status === "in_progress" ? "En cours"
                         : session.status === "completed" ? "Terminée"
                         : session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        <Button variant="ghost" className="h-8 px-2 text-xs">
                          Gérer →
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

