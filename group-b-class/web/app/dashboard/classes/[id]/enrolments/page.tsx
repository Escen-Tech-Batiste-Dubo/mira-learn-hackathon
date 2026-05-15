"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { ArrowLeft, Loader2, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { apiClient, ApiError } from "@/lib/api-client";
import type { MiraClass } from "@/types";
import type { EnrolmentDecision, EnrolmentListItem, EnrolmentListResponse, EnrolmentStatus } from "@/types/enrolment";

type SessionListItem = {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  location_city?: string | null;
  location_country?: string | null;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
};

const STATUS_FILTER_OPTIONS: { value: EnrolmentStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "applied", label: "Candidatures" },
  { value: "waitlist", label: "Liste d'attente" },
  { value: "accepted", label: "Acceptés" },
  { value: "rejected", label: "Refusés" },
  { value: "cancelled", label: "Annulés" },
  { value: "completed", label: "Terminés" },
];

function formatSessionLabel(s: SessionListItem): string {
  const start = new Date(s.starts_at);
  const loc = [s.location_city, s.location_country].filter(Boolean).join(", ");
  const dateStr = start.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const tail = loc ? ` · ${loc}` : "";
  return `${dateStr} · ${s.status.replace(/_/g, " ")}${tail}`;
}

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

export default function ClassEnrolmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
        </div>
      }
    >
      <ClassEnrolmentsPageInner />
    </Suspense>
  );
}

function ClassEnrolmentsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get("session");
  const classId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [classTitle, setClassTitle] = useState<string>("");
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<EnrolmentStatus | "all">("all");
  const [list, setList] = useState<EnrolmentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EnrolmentListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const pageSize = 20;

  useEffect(() => {
    if (!classId) return;

    let cancelled = false;

    async function loadMeta() {
      setLoadingMeta(true);
      setError(null);
      try {
        const [cls, sess] = await Promise.all([
          apiClient.get<MiraClass>(`/v1/classes/${classId}`),
          apiClient.get<SessionListItem[]>(`/v1/classes/${classId}/sessions`),
        ]);
        if (cancelled) return;
        setClassTitle(cls.title);
        setSessions(Array.isArray(sess) ? sess : []);
        if (Array.isArray(sess) && sess.length > 0) {
          const preferred =
            sessionFromUrl && sess.some((s) => s.id === sessionFromUrl) ? sessionFromUrl : null;
          setSessionId((prev) => {
            if (preferred) return preferred;
            if (prev && sess.some((s) => s.id === prev)) return prev;
            return sess[0].id;
          });
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Impossible de charger la classe ou les sessions.");
        setSessions([]);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    }

    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [classId, sessionFromUrl]);

  const fetchList = useCallback(async () => {
    if (!sessionId) {
      setList([]);
      setTotal(0);
      setHasMore(false);
      return;
    }
    setLoadingList(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter !== "all") {
        qs.set("status", statusFilter);
      }
      const data = await apiClient.get<EnrolmentListResponse>(
        `/v1/sessions/${sessionId}/enrolments?${qs.toString()}`,
      );
      setList(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (e) {
      setList([]);
      setError(e instanceof ApiError ? e.message : "Impossible de charger les candidatures.");
    } finally {
      setLoadingList(false);
    }
  }, [sessionId, statusFilter, page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    setPage(1);
  }, [sessionId, statusFilter]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId],
  );

  async function sendDecision(enrolmentId: string, decision: EnrolmentDecision, reason?: string | null) {
    setActingId(enrolmentId);
    setError(null);
    try {
      await apiClient.patch(`/v1/enrolments/${enrolmentId}/decision`, {
        decision,
        reason: reason ?? null,
      });
      setRejectTarget(null);
      setRejectReason("");
      await fetchList();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action impossible.");
    } finally {
      setActingId(null);
    }
  }

  if (!classId) {
    return null;
  }

  if (loadingMeta) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/dashboard/classes"
            className="inline-flex items-center gap-2 hover:text-[var(--primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Classes
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/dashboard/classes/${classId}/edit`} className="hover:text-[var(--primary)]">
            {classTitle || "Mira Class"}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--foreground)]">Candidatures</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Candidatures
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Gère les inscriptions par session : accepter, refuser ou placer en liste d&apos;attente.
            </p>
          </div>
          <Link href={`/dashboard/classes/${classId}/modules`}>
            <Button type="button" variant="outline">
              Modules
            </Button>
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" aria-hidden />
          <p className="mt-4 font-medium text-[var(--foreground)]">Aucune session pour cette class</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Crée une session pour commencer à recevoir des candidatures.
          </p>
          <Link href="/dashboard/sessions/new" className="mt-6 inline-block">
            <Button type="button">Nouvelle session</Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Session
                </span>
                <select
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-[var(--primary)] focus-visible:ring-2"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatSessionLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              {selectedSession ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Capacité :</span>{" "}
                    {selectedSession.enrolment_count}/{selectedSession.capacity} acceptés · liste d&apos;attente :{" "}
                    {selectedSession.waitlist_count}
                  </p>
                  <p className="mt-1">
                    Statut session :{" "}
                    <Badge variant="outline">{selectedSession.status.replace(/_/g, " ")}</Badge>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              {STATUS_FILTER_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            {loadingList ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-hidden />
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-[var(--muted-foreground)]">
                Aucune candidature pour ce filtre.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apprenant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => {
                    const canDecide = row.status === "applied" || row.status === "waitlist";
                    const busy = actingId === row.id;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-[var(--foreground)]" title={row.user_id}>
                            {shortUserId(row.user_id)}
                          </span>
                          {row.waitlist_position != null ? (
                            <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                              (#{row.waitlist_position} liste d&apos;attente)
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">
                          {formatDateTime(row.enrolled_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canDecide ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-xs"
                                disabled={busy}
                                onClick={() => void sendDecision(row.id, "accept", null)}
                              >
                                {busy ? "…" : "Accepter"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-xs"
                                disabled={busy}
                                onClick={() => void sendDecision(row.id, "waitlist", null)}
                              >
                                Attente
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-9 px-3 text-xs"
                                disabled={busy}
                                onClick={() => {
                                  setRejectTarget(row);
                                  setRejectReason("");
                                }}
                              >
                                Refuser
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          {total > pageSize || page > 1 ? (
            <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
              <span>
                {total} candidature{total > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={page <= 1 || loadingList}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={!hasMore || loadingList}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
          onClick={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
        >
          <Card
            className="w-full max-w-md space-y-4 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reject-dialog-title" className="font-serif text-lg font-semibold text-[var(--foreground)]">
              Refuser la candidature
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              La raison est obligatoire pour un refus (transparence vis-à-vis de l&apos;apprenant).
            </p>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-[var(--primary)] focus-visible:ring-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex. : profil pas aligné sur les prérequis de la session…"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={rejectReason.trim().length < 3 || actingId !== null}
                onClick={() => void sendDecision(rejectTarget.id, "reject", rejectReason.trim())}
              >
                Confirmer le refus
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
