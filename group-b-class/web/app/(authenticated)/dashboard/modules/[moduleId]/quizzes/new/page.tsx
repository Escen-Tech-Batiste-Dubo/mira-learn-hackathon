"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { apiClient, ApiError } from "@/lib/api-client";
import type { QuizDetailRead } from "@/types/quiz";
import { useAuth } from "@/hooks/useAuth";

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
export default function NewModuleQuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizDetailRead | null>(null);
  /** questionId → optionId choisie */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
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

          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm shadow-sm">
            <summary className="cursor-pointer font-medium text-[var(--color-foreground)]">
              Révision mentor — bonnes réponses visibles (relire le contenu généré par l’IA)
            </summary>
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              Aligné sur le template : les cartes éditeur montrent la bonne réponse pour contrôler le brouillon
              avant publication.
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
