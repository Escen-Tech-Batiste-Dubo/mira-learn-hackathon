"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { apiClient, ApiError } from "@/lib/api-client";
import type { QuizDetailRead, QuizQuestionRead } from "@/types/quiz";
import { useAuth } from "@/hooks/useAuth";

type QuestionDraft = {
  prompt: string;
  explanation: string;
  points: number;
  options: { id: string; label: string; is_correct: boolean }[];
};

function buildDraftsFromResult(quiz: QuizDetailRead): Record<string, QuestionDraft> {
  const next: Record<string, QuestionDraft> = {};
  for (const q of quiz.questions) {
    next[q.id] = {
      prompt: q.prompt,
      explanation: q.explanation ?? "",
      points: q.points,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        is_correct: o.is_correct,
      })),
    };
  }
  return next;
}

/**
 * Création QCM IA — aligné BRIEF : `/dashboard/modules/{id}/quizzes/new`
 *
 * BRIEF (l.28, l.93) : bouton « Générer 5 questions », puis pattern type Notion/Coda —
 * **preview** avant publication. Le template `design/template/.../QuizEditor.jsx` sépare :
 * - cartes questions côté mentor (bonne réponse visible pour relire l’IA) ;
 * - **Aperçu apprenant** : pastilles type radio + « Valider » (sans révéler la correction avant).
 *
 * Ici : après génération, l’aperçu apprenant est le flux principal ; la correction détaillée
 * n’apparaît qu’après « Valider » (local, pas une tentative serveur). La vue mentor est en repliable.
 */
function NewModuleQuizPageContent() {
  const params = useParams<{ moduleId: string }>();
  const searchParams = useSearchParams();
  const classIdFromQuery = searchParams.get("classId");
  const moduleId = params.moduleId;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizDetailRead | null>(null);
  /** questionId → optionId choisie */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const role = (user?.user_metadata as { role?: string } | undefined)?.role;
  const isMentor = role === "mentor";

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiClient.post<QuizDetailRead>(`/v1/modules/${moduleId}/quiz/generate`, {
        question_count: 5,
        difficulty: "medium",
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (!result) return;
    setAnswers({});
    setValidated(false);
  }, [result?.quiz.id]);

  useEffect(() => {
    if (!result) {
      setDrafts({});
      return;
    }
    setDrafts(buildDraftsFromResult(result));
  }, [result?.quiz.id]);

  const allAnswered = useMemo(() => {
    if (!result) return false;
    return result.questions.every((q) => answers[q.id] != null && answers[q.id] !== "");
  }, [result, answers]);

  const score = useMemo(() => {
    if (!result || !validated) return null;
    let ok = 0;
    for (const q of result.questions) {
      const chosen = answers[q.id];
      const correct = q.options.find((o) => o.is_correct);
      if (correct && chosen === correct.id) ok += 1;
    }
    return { ok, total: result.questions.length };
  }, [result, answers, validated]);

  const handleSaveQuestion = useCallback(
    async (q: QuizQuestionRead) => {
      if (!result) return;
      const d = drafts[q.id];
      if (!d) return;
      setEditError(null);
      setSavingQuestionId(q.id);
      try {
        const payload: Record<string, unknown> = {
          prompt: d.prompt.trim(),
          explanation: d.explanation.trim() === "" ? null : d.explanation.trim(),
          points: d.points,
          options: d.options.map((o) => ({
            id: o.id,
            label: o.label,
            is_correct: o.is_correct,
          })),
        };
        const data = await apiClient.patch<QuizDetailRead>(
          `/v1/quizzes/${result.quiz.id}/questions/${q.id}`,
          payload,
        );
        setResult(data);
        setDrafts(buildDraftsFromResult(data));
      } catch (e) {
        setEditError(e instanceof ApiError ? e.message : "Erreur inattendue");
      } finally {
        setSavingQuestionId(null);
      }
    },
    [result, drafts],
  );

  const modulesBackHref =
    classIdFromQuery && classIdFromQuery.length > 0
      ? `/dashboard/classes/${classIdFromQuery}/modules`
      : "/dashboard/classes";
  const modulesBackLabel =
    classIdFromQuery && classIdFromQuery.length > 0 ? "Retour aux modules" : "Retour aux classes";

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8 px-4">
      <header className="space-y-2">
        <Link
          href={modulesBackHref}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {modulesBackLabel}
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          Nouveau QCM
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Module <span className="font-mono text-[var(--color-foreground)]">{moduleId}</span> — génération
          assistée par IA (OpenRouter, Claude Haiku). Relisez toujours les questions avant publication.
        </p>
      </header>

      {!isMentor ? (
        <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted-foreground)]">
          Connectez-vous avec un compte <strong>mentor</strong> pour générer un QCM.
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--color-foreground)]">
            Cinq questions à choix unique, en français, basées sur le titre et la description du module.
          </p>
          <div>
            <Button type="button" disabled={loading} onClick={handleGenerate}>
              {loading ? "Génération en cours…" : "Générer 5 questions"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {result ? (
        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-semibold text-[var(--color-foreground)]">{result.quiz.title}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Statut : {result.quiz.status} — id quiz <span className="font-mono">{result.quiz.id}</span>
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Comme dans le brief produit : après génération, prévisualisez le QCM{" "}
                <strong className="text-[var(--color-foreground)]">comme un apprenant</strong> (réponses puis
                validation). Les corrections ne s’affichent qu’après « Valider mes réponses » — aperçu local,
                sans enregistrer de tentative.
              </p>
            </div>

            <div className="space-y-8">
              {result.questions.map((q, qi) => (
                <fieldset key={q.id} className="space-y-3 border-0 p-0">
                  <legend className="text-base font-medium text-[var(--color-foreground)]">
                    <span className="text-[var(--color-muted-foreground)]">Q{qi + 1}.</span> {q.prompt}
                  </legend>
                  <div className="flex flex-col gap-2">
                    {q.options.map((o) => {
                      const selected = answers[q.id] === o.id;
                      const showFeedback = validated;
                      const isCorrect = o.is_correct;
                      const wrongPick = showFeedback && selected && !isCorrect;

                      return (
                        <label
                          key={o.id}
                          className={[
                            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                            wrongPick
                              ? "border-[var(--color-destructive)] bg-red-50/80"
                              : showFeedback && selected && isCorrect
                                ? "border-[#16A34A] bg-[#16A34A]/10"
                                : showFeedback && isCorrect
                                  ? "border-[#16A34A]/50 bg-[#16A34A]/5"
                                  : "border-[var(--color-border)] bg-white hover:bg-[var(--color-muted)]/30",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={o.id}
                            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                            checked={selected}
                            disabled={validated}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                          />
                          <span className="min-w-0 flex-1 text-[var(--color-foreground)]">{o.label}</span>
                          {showFeedback && isCorrect ? (
                            <span className="shrink-0 text-xs font-medium text-[#16A34A]">Bonne réponse</span>
                          ) : null}
                          {showFeedback && wrongPick ? (
                            <span className="shrink-0 text-xs font-medium text-[var(--color-destructive)]">
                              Incorrect
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                  {validated && q.explanation ? (
                    <p className="text-xs italic text-[var(--color-muted-foreground)] border-l-2 border-[var(--color-border)] pl-3">
                      {q.explanation}
                    </p>
                  ) : null}
                </fieldset>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              {validated && score ? (
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  Résultat (aperçu) : {score.ok} / {score.total} bonnes réponses
                </p>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Répondez à toutes les questions pour activer la validation.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {validated ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAnswers({});
                      setValidated(false);
                    }}
                  >
                    Recommencer l’aperçu
                  </Button>
                ) : (
                  <Button type="button" disabled={!allAnswered} onClick={() => setValidated(true)}>
                    Valider mes réponses
                  </Button>
                )}
              </div>
            </div>
          </section>

          {result.quiz.status === "draft" ? (
            <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-sm shadow-sm">
              <div className="space-y-1">
                <h2 className="font-serif text-lg font-semibold text-[var(--color-foreground)]">
                  Édition mentor (brouillon)
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Corrigez l’énoncé, l’explication ou les réponses avant publication. Chaque question est enregistrée
                  via l’API <span className="font-mono">PATCH /v1/quizzes/…/questions/…</span>.
                </p>
              </div>
              {editError ? (
                <p className="text-sm text-[var(--color-destructive)]" role="alert">
                  {editError}
                </p>
              ) : null}
              <ol className="list-decimal space-y-8 pl-5 text-[var(--color-foreground)]">
                {result.questions.map((q) => {
                  const d = drafts[q.id];
                  if (!d) return null;
                  return (
                    <li key={`edit-${q.id}`} className="space-y-3">
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Question {q.position} — {q.type === "single_choice" ? "choix unique" : "choix multiples"}
                      </p>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Énoncé</span>
                        <textarea
                          className="min-h-[88px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] focus-visible:ring-2"
                          value={d.prompt}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], prompt: e.target.value },
                            }))
                          }
                          rows={4}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                          Explication (après réponse)
                        </span>
                        <textarea
                          className="min-h-[64px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] focus-visible:ring-2"
                          value={d.explanation}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], explanation: e.target.value },
                            }))
                          }
                          rows={3}
                        />
                      </label>
                      <label className="flex max-w-[120px] flex-col space-y-1">
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Points</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] focus-visible:ring-2"
                          value={d.points}
                          onChange={(e) => {
                            const n = Number.parseInt(e.target.value, 10);
                            setDrafts((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...prev[q.id],
                                points: Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 1,
                              },
                            }));
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Options</span>
                        <ul className="space-y-2 pl-0">
                          {d.options.map((o, oi) => (
                            <li
                              key={o.id}
                              className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-white/80 p-3 sm:flex-row sm:items-center sm:gap-3"
                            >
                              {q.type === "single_choice" ? (
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                                  checked={o.is_correct}
                                  onChange={() =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [q.id]: {
                                        ...prev[q.id],
                                        options: prev[q.id].options.map((opt) =>
                                          opt.id === o.id
                                            ? { ...opt, is_correct: true }
                                            : { ...opt, is_correct: false },
                                        ),
                                      },
                                    }))
                                  }
                                  aria-label={`Bonne réponse option ${oi + 1}`}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                                  checked={o.is_correct}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [q.id]: {
                                        ...prev[q.id],
                                        options: prev[q.id].options.map((opt) =>
                                          opt.id === o.id ? { ...opt, is_correct: e.target.checked } : opt,
                                        ),
                                      },
                                    }))
                                  }
                                  aria-label={`Option correcte ${oi + 1}`}
                                />
                              )}
                              <input
                                type="text"
                                className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] focus-visible:ring-2"
                                value={o.label}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      ...prev[q.id],
                                      options: prev[q.id].options.map((opt) =>
                                        opt.id === o.id ? { ...opt, label: e.target.value } : opt,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={savingQuestionId === q.id || d.prompt.trim() === ""}
                          onClick={() => void handleSaveQuestion(q)}
                        >
                          {savingQuestionId === q.id ? "Enregistrement…" : "Enregistrer cette question"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm shadow-sm">
            <summary className="cursor-pointer font-medium text-[var(--color-foreground)]">
              Révision mentor — bonnes réponses visibles (relire le contenu généré par l’IA)
            </summary>
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              Aligné sur le template : les cartes éditeur montrent la bonne réponse pour contrôler le brouillon
              avant publication. L’édition inline se fait dans la section « Édition mentor » ci-dessus lorsque le quiz
              est en brouillon.
            </p>
            <ol className="mt-4 list-decimal space-y-5 pl-5 text-[var(--color-foreground)]">
              {result.questions.map((q) => (
                <li key={`mentor-${q.id}`} className="space-y-2">
                  <p className="font-medium">{q.prompt}</p>
                  <ul className="space-y-1.5 pl-0">
                    {q.options.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[var(--color-muted-foreground)]">{o.label}</span>
                        {o.is_correct ? (
                          <span className="rounded-full bg-[#16A34A]/15 px-2 py-0.5 text-xs font-medium text-[#16A34A]">
                            bonne réponse
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </details>
        </div>
      ) : null}
    </div>
  );
}

export default function NewModuleQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-[var(--muted-foreground)]">
          Chargement…
        </div>
      }
    >
      <NewModuleQuizPageContent />
    </Suspense>
  );
}
