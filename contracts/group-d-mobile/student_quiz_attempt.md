# student_quiz_attempt

**Possédé par** : Group D (write)
**Reprenabilité post-hackathon** : migration vers `forms-api.form_submission` (V1.5)

## Description fonctionnelle

Une tentative de réponse à un QCM (`mira_class_module_quiz`) par un étudiant. Chaque tentative démarre, l'étudiant répond aux questions, soumet, et obtient un score + résultat (passed/failed selon `pass_threshold_pct`).

Limitée par `max_attempts` du quiz. Tentative ouverte (non soumise) trackée séparément pour reprise.

## Schéma SQL

```sql
CREATE TABLE student_quiz_attempt (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    quiz_id UUID NOT NULL,                                 -- ref mira_class_module_quiz.id (read seed)
    module_id UUID NOT NULL,                               -- denorm pour query directe
    class_id UUID NOT NULL,                                -- denorm

    -- Numérotation
    attempt_number INTEGER NOT NULL,                       -- 1, 2, 3... (cf. quiz.max_attempts)

    -- Lifecycle
    status VARCHAR(16) NOT NULL DEFAULT 'started' CHECK (status IN (
        'started', 'submitted', 'expired', 'abandoned'
    )),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE NULL,
    expired_at TIMESTAMP WITH TIME ZONE NULL,              -- si time_limit dépassé
    time_spent_seconds INTEGER NULL,

    -- Scoring
    score INTEGER NULL,                                    -- points obtenus
    max_score INTEGER NOT NULL,                            -- total points possibles (snapshot moment de la tentative)
    score_pct NUMERIC(5, 2) NULL CHECK (score_pct IS NULL OR score_pct BETWEEN 0 AND 100),
    passed BOOLEAN NULL,                                   -- score_pct >= quiz.pass_threshold_pct ; NULL avant submit

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, quiz_id, attempt_number)
);

CREATE INDEX idx_student_quiz_attempt_user_quiz ON student_quiz_attempt (user_id, quiz_id);
CREATE INDEX idx_student_quiz_attempt_class ON student_quiz_attempt (user_id, class_id);
CREATE INDEX idx_student_quiz_attempt_status ON student_quiz_attempt (status);
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

AttemptStatus = Literal["started", "submitted", "expired", "abandoned"]


class StudentQuizAttemptStart(BaseModel):
    """Démarrer une tentative."""
    pass  # body vide, quiz_id en path


class StudentQuizAttemptSubmit(BaseModel):
    """Soumettre les réponses pour scoring."""
    pass  # les réponses sont créées via student_quiz_answer endpoint pendant la tentative


class StudentQuizAttemptRead(BaseModel):
    id: str
    user_id: str
    quiz_id: str
    module_id: str
    class_id: str
    attempt_number: int
    status: AttemptStatus
    started_at: datetime
    submitted_at: Optional[datetime]
    expired_at: Optional[datetime]
    time_spent_seconds: Optional[int]
    score: Optional[int]
    max_score: int
    score_pct: Optional[Decimal]
    passed: Optional[bool]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Vérification `attempt_number`** : doit être <= `quiz.max_attempts`. Si dépassé → 409.
- Auto-numéroter à la création : `MAX(attempt_number) + 1` pour `(user_id, quiz_id)`
- **Une seule tentative `started`** à la fois pour `(user_id, quiz_id)` (le user doit finir ou abandonner avant nouvelle)
- **Auto-expiration** : si `quiz.time_limit_seconds` et `NOW() > started_at + time_limit_seconds` → trigger / cron passe status='expired', score calculé sur les réponses déjà saisies
- **Scoring** au submit :
  - Pour chaque `student_quiz_answer` : check `is_correct` (calculé côté service en comparant `selected_option_ids` aux options correctes)
  - `score = SUM(question.points si is_correct)`
  - `score_pct = score / max_score * 100`
  - `passed = score_pct >= quiz.pass_threshold_pct`
- À `passed=TRUE` : trigger validation skill associée (si le module a une skill primary, marque la skill validée pour le user)

## Relations

- **Référence** :
  - `user_id` → Supabase `auth.users.id`
  - `quiz_id` → `mira_class_module_quiz.id` (référence logique cross-groupe)
- **Référencée par** :
  - `student_quiz_answer.attempt_id` (CASCADE)

## Routes API

```
POST   /v1/students/me/quizzes/{quiz_id}/attempts                  — démarrer
GET    /v1/students/me/quizzes/{quiz_id}/attempts                  — list mes tentatives sur ce quiz
GET    /v1/students/me/attempts/{id}                               — détail (avec réponses)
PATCH  /v1/students/me/attempts/{id}/answers                       — sauvegarder réponses (autosave)
POST   /v1/students/me/attempts/{id}/submit                        — soumettre + scorer
POST   /v1/students/me/attempts/{id}/abandon                       — abandonner
GET    /v1/students/me/quiz-attempts                               — historique global
```

## Seed attendu

Pour les 2 nomads inscrits : 3-5 tentatives seedées, mix passed/failed avec attempts répétées sur certains quizzes (pour démontrer le `max_attempts`).

## Reprenabilité

**Mapping** : `forms-api.form_submission` — renommages :
- `quiz_id` → `form_id`
- `attempt_number` → `submission_number`
- `passed` → `passed`
- Logique scoring : équivalente

**Effort** : ~3h Claude Code (couplé migration forms-api).
