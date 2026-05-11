/** Réponses API `/v1/modules/:id/quiz` et `/quiz/generate` (JSend `data`). */

export type QuizStatus = "draft" | "published" | "archived";

export type QuizOptionRead = {
  id: string;
  position: number;
  label: string;
  is_correct: boolean;
  explanation: string | null;
};

export type QuizQuestionRead = {
  id: string;
  position: number;
  type: string;
  prompt: string;
  points: number;
  explanation: string | null;
  options: QuizOptionRead[];
};

export type MiraClassModuleQuizRead = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  pass_threshold_pct: number;
  time_limit_seconds: number | null;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_explanations_after: boolean;
  status: QuizStatus;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type QuizDetailRead = {
  quiz: MiraClassModuleQuizRead;
  questions: QuizQuestionRead[];
};
