"use client";

import { useParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { apiClient, ApiError } from "@/lib/api-client";
import type { QuizDetailRead } from "@/types/quiz";
import { useAuth } from "@/hooks/useAuth";

/**
 * Création QCM IA — aligné BRIEF : `/dashboard/modules/{id}/quizzes/new`
 * Proto : `design/template/src/screens/QuizEditor.jsx` (génération IA).
 */
export default function NewModuleQuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizDetailRead | null>(null);

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
        <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-[var(--color-foreground)]">{result.quiz.title}</h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Statut : {result.quiz.status} — id quiz{" "}
            <span className="font-mono">{result.quiz.id}</span>
          </p>
          <ol className="list-decimal space-y-6 pl-5 text-sm text-[var(--color-foreground)]">
            {result.questions.map((q) => (
              <li key={q.id} className="space-y-2">
                <p className="font-medium">{q.prompt}</p>
                <ul className="list-disc space-y-1 pl-5 text-[var(--color-muted-foreground)]">
                  {q.options.map((o) => (
                    <li key={o.id}>
                      {o.label}
                      {o.is_correct ? (
                        <span className="ml-2 text-xs font-semibold text-[#16A34A]">correcte</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {q.explanation ? (
                  <p className="text-xs italic text-[var(--color-muted-foreground)]">{q.explanation}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
