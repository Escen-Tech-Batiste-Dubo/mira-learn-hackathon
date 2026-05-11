# mira_class_module_quiz_option

**Possédé par** : Group B (write), Group D (read seed)
**Reprenabilité post-hackathon** : migration vers `forms-api.question_option`

## Description fonctionnelle

Une option de réponse à une question de QCM. Chaque option a un libellé visible et un flag `is_correct` qui indique si c'est la bonne réponse.

Pour `single_choice` : exactement 1 option `is_correct=TRUE` sur les options de la question.
Pour `multi_choice` : 1 ou plusieurs options `is_correct=TRUE`.

## Schéma SQL

```sql
CREATE TABLE mira_class_module_quiz_option (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES mira_class_module_quiz_question(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre d'affichage
    label TEXT NOT NULL,                                   -- texte de l'option
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT NULL,                                 -- explication spécifique à cette option (optionnel)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (question_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_quiz_option_question_id ON mira_class_module_quiz_option (question_id, position);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MiraClassModuleQuizOptionBase(BaseModel):
    position: int = Field(..., ge=1)
    label: str = Field(..., max_length=1000)
    is_correct: bool = False
    explanation: Optional[str] = Field(None, max_length=1000)


class MiraClassModuleQuizOptionCreate(MiraClassModuleQuizOptionBase):
    pass


class MiraClassModuleQuizOptionUpdate(BaseModel):
    position: Optional[int] = Field(None, ge=1)
    label: Optional[str] = Field(None, max_length=1000)
    is_correct: Optional[bool] = None
    explanation: Optional[str] = None


class MiraClassModuleQuizOptionRead(MiraClassModuleQuizOptionBase):
    id: str
    question_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MiraClassModuleQuizOptionPublic(BaseModel):
    """Vue publique pour Group D : pas de is_correct."""
    id: str
    position: int
    label: str
```

## Contraintes métier

- 2-6 options par question (validation service au moment du publish)
- `is_correct` masqué dans la vue publique apprenant (Group D)
- À la révélation de la correction (après réponse de l'apprenant) : `is_correct` + `explanation` deviennent visibles

## Relations

- **Référence** : `question_id` → `mira_class_module_quiz_question.id` (CASCADE)

## Routes API

```
POST   /v1/questions/{question_id}/options                 — créer
GET    /v1/questions/{question_id}/options                 — list
PATCH  /v1/options/{id}                                    — update (peut changer is_correct)
DELETE /v1/options/{id}                                    — supprimer
```

Pas d'endpoint public dédié — les options sont retournées avec leur question via `/v1/quizzes/{id}/questions/public` (sans `is_correct`).

## Seed attendu

Pour chaque question seedée : 3-5 options avec `is_correct` conforme au type de la question.

## Reprenabilité

**Mapping** : `forms-api.question_option` — schéma équivalent (renommages mineurs uniquement).

**Effort** : ~30 min (couplé migration quiz parent).
