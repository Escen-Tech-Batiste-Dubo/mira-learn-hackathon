"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
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
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { EnrolmentStatus, MentorEnrolmentListItem, MentorEnrolmentListResponse } from "@/types/enrolment";

const STATUS_FILTER_OPTIONS: { value: EnrolmentStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "applied", label: "Candidatures" },
  { value: "waitlist", label: "Liste d'attente" },
  { value: "accepted", label: "Acceptés" },
  { value: "rejected", label: "Refusés" },
  { value: "cancelled", label: "Annulés" },
  { value: "completed", label: "Terminés" },
];

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function shortUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

function statusBadgeVariant(
  status: EnrolmentStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "accepted":
    case "completed":
      return "default";
    case "applied":
      return "secondary";
    case "waitlist":
      return "outline";
    case "rejected":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: EnrolmentStatus): string {
  const map: Record<EnrolmentStatus, string> = {
    applied: "Candidature",
    waitlist: "Liste d'attente",
    accepted: "Accepté",
    rejected: "Refusé",
    cancelled: "Annulé",
    completed: "Terminé",
  };
  return map[status] ?? status;
}

function sessionLocation(row: MentorEnrolmentListItem): string {
  const parts = [row.location_city, row.location_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function LearnersPage() {
  const [statusFilter, setStatusFilter] = useState<EnrolmentStatus | "all">("all");
  const [list, setList] = useState<MentorEnrolmentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter !== "all") {
        qs.set("status", statusFilter);
      }
      const data = await apiClient.get<MentorEnrolmentListResponse>(`/v1/me/enrolments?${qs.toString()}`);
      setList(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (e) {
      setList([]);
      setError(e instanceof ApiError ? e.message : "Impossible de charger les inscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <GraduationCap className="h-6 w-6" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">CRM</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[var(--foreground)]">Apprenants</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Toutes les candidatures et inscriptions sur tes sessions, toutes classes confondues.
          </p>
        </div>
      </header>

      <Card className="border-[var(--border)] bg-[var(--color-card)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Inscriptions</CardTitle>
            <CardDescription>
              Filtre par statut — les candidatures en cours sont <strong className="text-[var(--foreground)]">Candidature</strong> et{" "}
              <strong className="text-[var(--foreground)]">Liste d&apos;attente</strong>.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={statusFilter === opt.value ? "primary" : "outline"}
                className="rounded-full px-3 py-1.5 text-xs"
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Aucune inscription pour ce filtre. Les candidatures en attente de décision apparaissent en « Candidature ».
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apprenant</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--foreground)]" title={row.user_id}>
                          {shortUserId(row.user_id)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">{row.class_title}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                        {formatDateTime(row.session_starts_at)}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">{sessionLocation(row)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                        {row.status === "waitlist" && row.waitlist_position != null ? (
                          <span className="ml-2 text-xs text-[var(--muted-foreground)]">#{row.waitlist_position}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/classes/${row.class_id}/enrolments?session=${row.session_id}`}
                          className={cn(
                            "inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)]",
                            "bg-[var(--color-card)] px-3 text-xs font-medium hover:bg-[var(--color-background)]",
                          )}
                        >
                          Traiter
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && list.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                {total} inscription{total > 1 ? "s" : ""} au total · page {page}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3 text-xs"
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
