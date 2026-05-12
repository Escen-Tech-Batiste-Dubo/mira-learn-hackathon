"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";

interface Session {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_city?: string;
  location_country?: string;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
}

export default function SessionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchSessions();
  }, [user, loading, router]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // GET /v1/classes/{class_id}/sessions — requiert de charger les classes du mentor en premier
      // Pour démo, on récupère toutes les sessions de toutes les classes du mentor
      const response = await apiClient.get("/v1/me/sessions");
      if (response.data && Array.isArray(response.data)) {
        setSessions(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setError("Erreur lors du chargement des sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm");
    } catch {
      return dateStr;
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

  const formatMapLocation = (session: Session) => {
    if (session.type === "virtual") return "En ligne";
    const parts = [];
    if (session.location_city) parts.push(session.location_city);
    if (session.location_country) parts.push(session.location_country);
    return parts.length > 0 ? parts.join(", ") : "À définir";
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Gérez toutes les sessions de vos classes
          </p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button>+ Créer une session</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Chargement des sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucune session créée</p>
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
              Cliquez sur une session pour visualiser et modifier ses détails
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
                  <TableHead className="text-right">Inscrits / Waitlist</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium capitalize">{session.type}</TableCell>
                    <TableCell>{formatMapLocation(session)}</TableCell>
                    <TableCell className="text-sm">{formatDate(session.starts_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(session.ends_at)}</TableCell>
                    <TableCell className="text-right">{session.capacity}</TableCell>
                    <TableCell className="text-right">
                      {session.enrolment_count} / {session.waitlist_count}
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
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

