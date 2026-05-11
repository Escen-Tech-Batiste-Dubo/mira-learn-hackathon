# student_path_regeneration_log

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : audit log `learn-api` (analytics + debug IA)

## Description fonctionnelle

Trace les regénérations d'un parcours d'apprentissage. À chaque appel à l'IA (initial ou regénération), une ligne est créée pour audit :
- Quel prompt envoyé (hash pour debug + déduplication)
- Quels tokens consommés (audit coût)
- Quel trigger (changement targets, skip step, validation skill, etc.)
- Quelle version du modèle utilisée

Permet :
- D'analyser les coûts OpenRouter par utilisateur
- De déboguer si l'IA génère des parcours absurdes (replay du prompt)
- D'optimiser le prompt engineering post-hackathon

## Schéma SQL

```sql
CREATE TABLE student_path_regeneration_log (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    path_id UUID NOT NULL REFERENCES student_learning_path(id) ON DELETE CASCADE,

    trigger_reason VARCHAR(64) NOT NULL CHECK (trigger_reason IN (
        'initial', 'target_skills_changed', 'target_horizon_changed',
        'skill_validated_outside_path', 'step_skipped', 'manual_request'
    )),

    -- Inputs IA
    input_target_skills JSONB NOT NULL,
    input_horizon VARCHAR(16) NOT NULL,
    input_acquired_skills JSONB NOT NULL,
    input_catalog_snapshot_count INTEGER NOT NULL,         -- nb de classes prises en compte

    -- Output IA
    output_total_steps INTEGER NOT NULL,
    output_estimated_duration_hours INTEGER NOT NULL,

    -- Audit
    llm_model_used VARCHAR(64) NOT NULL,
    llm_tokens_consumed INTEGER NOT NULL,
    llm_cost_estimated_cents INTEGER NULL,                 -- coût estimé pour ce call
    generation_prompt_hash VARCHAR(64) NOT NULL,           -- SHA256 du prompt complet
    generation_latency_ms INTEGER NULL,
    generation_success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT NULL,                               -- si generation_success=FALSE

    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_path_regen_log_path_id ON student_path_regeneration_log (path_id, generated_at DESC);
CREATE INDEX idx_path_regen_log_trigger ON student_path_regeneration_log (trigger_reason);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

TriggerReason = Literal[
    "initial", "target_skills_changed", "target_horizon_changed",
    "skill_validated_outside_path", "step_skipped", "manual_request"
]


class StudentPathRegenerationLogRead(BaseModel):
    id: str
    path_id: str
    trigger_reason: TriggerReason
    input_target_skills: list[str]
    input_horizon: str
    input_acquired_skills: list[str]
    input_catalog_snapshot_count: int
    output_total_steps: int
    output_estimated_duration_hours: int
    llm_model_used: str
    llm_tokens_consumed: int
    llm_cost_estimated_cents: Optional[int]
    generation_prompt_hash: str
    generation_latency_ms: Optional[int]
    generation_success: bool
    error_message: Optional[str]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- Append-only (pas d'UPDATE)
- 1 ligne par appel IA — y compris les échecs (`generation_success=FALSE`)
- Permet de comparer la qualité des prompts via prompt_hash (re-run le même input différent ?)

## Relations

- **Référence** : `path_id` → `student_learning_path.id` (CASCADE)

## Routes API

Internal uniquement (pas exposé apprenant) :
```
GET    /internal/learning-paths/{path_id}/regeneration-log    — historique pour debug
GET    /internal/analytics/llm-costs/by-user                  — agrégat coûts par user
```

Admin (pour insights produit) :
```
GET    /v1/admin/learning-paths/regeneration-log              — global, filtres + agrégats
```

## Seed attendu

Pour chaque `student_learning_path` : 1-2 entries `trigger_reason='initial'` (la génération de départ). Optionnellement, 1 entry `target_skills_changed` ou `step_skipped` pour démontrer la regen.

## Reprenabilité

**Mapping** : audit log dans `learn-api` (table dédiée) ou dans `bots-api.suggestion_log` (consolidé avec autres logs IA).

**Effort** : ~1h Claude Code.
