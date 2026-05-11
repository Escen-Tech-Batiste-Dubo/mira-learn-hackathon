# student_learning_path

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : migration vers futur `learn-api.learning_path` (à créer V1.5 selon PRD V3)

## Description fonctionnelle

Parcours d'apprentissage personnalisé d'un étudiant. Généré par l'IA (OpenRouter) à partir de :
- Les `target_skills` du `student_profile`
- Les `student_skill` déjà acquises (à exclure)
- Le `learning_horizon`
- Les `skill_relation` (prerequisites + related — pour ordonner intelligemment)
- Le catalogue des classes published (pour proposer des classes par skill)

Output : une séquence ordonnée d'`student_learning_path_step` (1 par skill cible) avec pour chacun 3 classes recommandées + justification IA.

## Schéma SQL

```sql
CREATE TABLE student_learning_path (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL DEFAULT '',                 -- "Mon parcours growth marketing"
    target_skills JSONB NOT NULL DEFAULT '[]'::jsonb,      -- snapshot des skills cibles au moment de la génération
    target_horizon VARCHAR(16) NOT NULL CHECK (target_horizon IN (
        '3_months', '6_months', '1_year', '2_years'
    )),

    -- Output IA
    total_steps INTEGER NOT NULL DEFAULT 0,
    estimated_duration_hours INTEGER NOT NULL DEFAULT 0,
    completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,       -- 0-100, calculé depuis student_learning_path_step

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'completed', 'abandoned'
    )),

    -- IA tracking
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    llm_model_used VARCHAR(64) NOT NULL,
    llm_tokens_consumed INTEGER NULL,

    started_at TIMESTAMP WITH TIME ZONE NULL,              -- première étape validée
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    abandoned_at TIMESTAMP WITH TIME ZONE NULL,
    abandoned_reason VARCHAR(64) NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_student_learning_path_profile_id ON student_learning_path (profile_id, status)
    WHERE deleted_at IS NULL;
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

LearningHorizon = Literal["3_months", "6_months", "1_year", "2_years"]
PathStatus = Literal["active", "completed", "abandoned"]
AbandonReason = Literal[
    "changed_goals", "too_long", "too_difficult", "not_motivated", "other"
]


class StudentLearningPathGenerateRequest(BaseModel):
    """Création + génération IA en une étape."""
    name: Optional[str] = Field(None, max_length=200)
    target_skills: list[str] = Field(..., min_length=1, max_length=10)
    target_horizon: LearningHorizon


class StudentLearningPathRegenerateRequest(BaseModel):
    """Re-génération suite à un changement (target update, skip step, etc.)."""
    new_target_skills: Optional[list[str]] = None
    new_target_horizon: Optional[LearningHorizon] = None
    trigger_reason: str = Field(..., max_length=120)


class StudentLearningPathRead(BaseModel):
    id: str
    profile_id: str
    name: str
    target_skills: list[str]
    target_horizon: LearningHorizon
    total_steps: int
    estimated_duration_hours: int
    completion_pct: Decimal
    status: PathStatus
    generated_at: datetime
    llm_model_used: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    abandoned_at: Optional[datetime]
    abandoned_reason: Optional[AbandonReason]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentLearningPathAbandon(BaseModel):
    reason: AbandonReason
```

## Contraintes métier

- **Un seul `active` path par profil** à la fois (validation service)
- À la génération :
  1. Build prompt LLM : profil + targets + horizon + skills_acquises + catalogue classes + skill_relations
  2. LLM retourne JSON structuré : `[{skill_id, position, justification, recommended_class_ids[]}]`
  3. Persisté en `student_learning_path` + N `student_learning_path_step`
  4. Log dans `student_path_regeneration_log` avec prompt_hash
- À la regénération : log dans `student_path_regeneration_log`, nouveaux steps créés (anciens marqués `skipped` ou supprimés)
- **`completion_pct`** = (count steps validated / total_steps) × 100 — recalculé à chaque validation

## Relations

- **Référence** : `profile_id` → `student_profile.id` (CASCADE)
- **Référencée par** :
  - `student_learning_path_step.path_id` (CASCADE)
  - `student_path_regeneration_log.path_id`

## Routes API

```
POST   /v1/students/me/learning-paths                       — créer + générer IA
GET    /v1/students/me/learning-paths                       — list mes paths
GET    /v1/students/me/learning-paths/{id}                  — détail (avec steps)
POST   /v1/students/me/learning-paths/{id}/regenerate       — regénérer (ajustement targets/horizon)
POST   /v1/students/me/learning-paths/{id}/abandon          — abandonner
DELETE /v1/students/me/learning-paths/{id}                  — soft delete
```

## Seed attendu

Pour 5-7 nomads seedés : 1 `student_learning_path` `active` chacun avec 4-7 steps. 1-2 nomads sans path actif (pour démontrer le flow "Crée ton premier parcours").

## Reprenabilité

**Mapping** : futur `learn-api.learning_path` (V1.5).

**Transformations** :
1. Création du service `learn-api` mini selon PRD V3
2. Migration data hackathon → learn-api
3. Refactor du moteur de génération : appel HMAC vers `bots-api` avec tool dédié `generate_learning_path`
4. NATS events :
   - `learn.path.generated` → community-api (activity feed)
   - `learn.path.completed` → certificats + email célébration
5. Recommendations adaptatives via `matching-api`

**Effort** : ~5-6h Claude Code (service learn-api complet à créer).
