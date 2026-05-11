# mira_class_module_quiz_question

**Possédé par** : Group B (write), Group D (read seed)
**Reprenabilité post-hackathon** : migration vers `forms-api.question`

## Description fonctionnelle

Une question d'un QCM. Deux types supportés :
- `single_choice` : une seule bonne réponse parmi les options
- `multi_choice` : plusieurs bonnes réponses possibles parmi les options

Chaque question a des options (`mira_class_module_quiz_option`) avec un flag `is_correct`. Score = points si la question est correctement répondue (toutes les bonnes options sélectionnées, aucune mauvaise).

## Schéma SQL

```sql
CREATE TABLE mira_class_module_quiz_question (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES mira_class_module_quiz(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre dans le quiz
    type VARCHAR(16) NOT NULL CHECK (type IN ('single_choice', 'multi_choice')),
    prompt TEXT NOT NULL,                                  -- énoncé de la question (markdown)
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 1),
    explanation TEXT NULL,                                 -- affichée après réponse si quiz.show_explanations_after=TRUE
    image_url VARCHAR(500) NULL,                           -- image optionnelle accompagnant la question
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (quiz_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_quiz_question_quiz_id ON mira_class_module_quiz_question (quiz_id, position);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

QuestionType = Literal["single_choice", "multi_choice"]


class MiraClassModuleQuizQuestionBase(BaseModel):
    position: int = Field(..., ge=1)
    type: QuestionType
    prompt: str = Field(..., max_length=2000)
    points: int = Field(default=1, ge=1)
    explanation: Optional[str] = Field(None, max_length=2000)
    image_url: Optional[str] = Field(None, max_length=500)


class MiraClassModuleQuizQuestionCreate(MiraClassModuleQuizQuestionBase):
    pass


class MiraClassModuleQuizQuestionUpdate(BaseModel):
    position: Optional[int] = Field(None, ge=1)
    type: Optional[QuestionType] = None
    prompt: Optional[str] = Field(None, max_length=2000)
    points: Optional[int] = Field(None, ge=1)
    explanation: Optional[str] = None
    image_url: Optional[str] = None


class MiraClassModuleQuizQuestionRead(MiraClassModuleQuizQuestionBase):
    id: str
    quiz_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MiraClassModuleQuizQuestionPublic(BaseModel):
    """Vue publique (sans réponses correctes), pour Group D."""
    id: str
    position: int
    type: QuestionType
    prompt: str
    points: int
    image_url: Optional[str]
    # PAS de explanation ici — révélée après réponse uniquement
```

## Contraintes métier

- 3-30 questions par quiz (validation service)
- `UNIQUE (quiz_id, position)` deferrable pour permettre les reorder
- À la création d'une question : la question doit avoir au moins 2 `mira_class_module_quiz_option` pour être valide (validation au moment de la publication du quiz)
- Pour `type='single_choice'` : exactement 1 option avec `is_correct=TRUE`
- Pour `type='multi_choice'` : au moins 1 option avec `is_correct=TRUE`

## Relations

- **Référence** : `quiz_id` → `mira_class_module_quiz.id` (CASCADE)
- **Référencée par** :
  - `mira_class_module_quiz_option.question_id` (CASCADE)
  - `student_quiz_answer.question_id` (Group D, référence logique cross-groupe)

## Routes API

```
POST   /v1/quizzes/{quiz_id}/questions                     — créer
GET    /v1/quizzes/{quiz_id}/questions                     — list (avec options)
PATCH  /v1/quizzes/{quiz_id}/questions/{id}                — update
DELETE /v1/quizzes/{quiz_id}/questions/{id}                — supprimer
PATCH  /v1/quizzes/{quiz_id}/questions/reorder             — réordonner (body list ids)
```

Public (Group D) :
```
GET    /v1/quizzes/{quiz_id}/questions/public              — version publique (sans is_correct ni explanation)
```

## Seed attendu

Pour chaque quiz seedé : 5-10 questions avec types mixés (~70% single_choice, ~30% multi_choice), `points` varié (1-3), explanations renseignées sur ~80%.

## Reprenabilité

**Mapping** : `forms-api.question` — schéma équivalent avec quelques renommages :
- `quiz_id` → `form_id`
- `prompt` → `prompt` (identique)
- Le type `single_choice`/`multi_choice` reste

**Effort** : ~1h (couplé à la migration quiz parent).
