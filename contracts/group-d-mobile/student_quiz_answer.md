# student_quiz_answer

**Possédé par** : Group D (write)
**Reprenabilité post-hackathon** : migration vers `forms-api.answer` (V1.5)

## Description fonctionnelle

Réponse d'un étudiant à une question d'un QCM, dans le cadre d'une tentative (`student_quiz_attempt`). Stocke les options sélectionnées et calcule `is_correct` au moment du submit de la tentative.

## Schéma SQL

```sql
CREATE TABLE student_quiz_answer (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES student_quiz_attempt(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,                             -- ref mira_class_module_quiz_question.id

    selected_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- liste UUID
    is_correct BOOLEAN NULL,                                -- NULL avant submit, computed après
    points_earned INTEGER NULL,                             -- NULL avant submit

    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_student_quiz_answer_attempt_id ON student_quiz_answer (attempt_id);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StudentQuizAnswerCreate(BaseModel):
    question_id: str
    selected_option_ids: list[str]


class StudentQuizAnswerUpdate(BaseModel):
    """Changer sa réponse (avant submit attempt)."""
    selected_option_ids: list[str]


class StudentQuizAnswerRead(BaseModel):
    id: str
    attempt_id: str
    question_id: str
    selected_option_ids: list[str]
    is_correct: Optional[bool]
    points_earned: Optional[int]
    answered_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- `UNIQUE (attempt_id, question_id)` : 1 réponse par question dans la tentative
- **Saisie pendant `attempt.status='started'` uniquement** : après submit, lock
- **Calcul `is_correct` au submit** :
  - Récupérer les options correctes de la question (seed read côté Group D)
  - `is_correct = set(selected_option_ids) == set(correct_option_ids)` (égalité exacte pour multi_choice : sélection des bonnes ET seulement les bonnes)
  - Pour `single_choice` : check 1 seule option sélectionnée + qu'elle soit la correcte
- `points_earned = question.points if is_correct else 0`

## Relations

- **Référence** :
  - `attempt_id` → `student_quiz_attempt.id` (CASCADE)
  - `question_id` → `mira_class_module_quiz_question.id` (référence logique)
  - `selected_option_ids[]` → `mira_class_module_quiz_option.id` (référence logique)

## Routes API

Endpoints gérés via `student_quiz_attempt` (cf `PATCH /students/me/attempts/{id}/answers`) :

```
POST   /v1/students/me/attempts/{attempt_id}/answers          — saisir/modifier une réponse
PUT    /v1/students/me/attempts/{attempt_id}/answers          — batch update (autosave)
GET    /v1/students/me/attempts/{attempt_id}/answers          — list (avec is_correct après submit)
```

## Seed attendu

Pour chaque `student_quiz_attempt` seedé : ses réponses (1 par question du quiz). `is_correct` calculé cohérent avec `attempt.passed`.

## Reprenabilité

**Mapping** : `forms-api.answer` — renommages :
- `attempt_id` → `submission_id`
- `selected_option_ids` → `response_value` (JSONB générique pour différents types de questions)
- `is_correct`, `points_earned` : préservés

**Effort** : ~1h Claude Code (couplé attempt).
