# student_learning_path_step

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : migration vers `learn-api.learning_path_step`

## Description fonctionnelle

Une étape d'un `student_learning_path`. Chaque étape correspond à **1 skill à acquérir** + **3 classes recommandées** par l'IA pour acquérir cette skill. L'étudiant suit les étapes dans l'ordre, peut valider via complétion class, sauter, ou marquer skill validée manuellement.

## Schéma SQL

```sql
CREATE TABLE student_learning_path_step (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    path_id UUID NOT NULL REFERENCES student_learning_path(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre dans le path (1-indexed)
    skill_id UUID NOT NULL,                                -- la skill cible de cette étape

    -- Recommandations IA
    recommended_class_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : ["class_uuid_1", "class_uuid_2", "class_uuid_3"]
    justification TEXT NOT NULL DEFAULT '',                -- argumentaire IA pour cette étape
    estimated_duration_hours INTEGER NOT NULL DEFAULT 0,

    -- Progression
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'validated', 'skipped'
    )),
    started_at TIMESTAMP WITH TIME ZONE NULL,              -- set à la première inscription d'une class de cette étape
    validated_at TIMESTAMP WITH TIME ZONE NULL,
    validated_via VARCHAR(32) NULL CHECK (validated_via IS NULL OR validated_via IN (
        'class_completion', 'quiz', 'self_declared'
    )),
    validated_via_class_session_id UUID NULL,              -- ref mira_class_session si validation via class
    skipped_at TIMESTAMP WITH TIME ZONE NULL,
    skipped_reason TEXT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (path_id, position) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE (path_id, skill_id)                             -- une skill apparaît 1x dans un path
);

CREATE INDEX idx_learning_path_step_path_id ON student_learning_path_step (path_id, position);
CREATE INDEX idx_learning_path_step_skill_id ON student_learning_path_step (skill_id);
CREATE INDEX idx_learning_path_step_status ON student_learning_path_step (path_id, status);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

StepStatus = Literal["pending", "in_progress", "validated", "skipped"]
ValidationSource = Literal["class_completion", "quiz", "self_declared"]


class StudentLearningPathStepBase(BaseModel):
    position: int = Field(..., ge=1)
    skill_id: str
    recommended_class_ids: list[str] = []
    justification: str = ""
    estimated_duration_hours: int = Field(default=0, ge=0)


class StudentLearningPathStepCreate(StudentLearningPathStepBase):
    pass


class StudentLearningPathStepValidate(BaseModel):
    """Validation manuelle (self_declared)."""
    validated_via: ValidationSource = "self_declared"
    validated_via_class_session_id: Optional[str] = None


class StudentLearningPathStepSkip(BaseModel):
    skipped_reason: str = Field(..., max_length=500)


class StudentLearningPathStepRead(StudentLearningPathStepBase):
    id: str
    path_id: str
    status: StepStatus
    started_at: Optional[datetime]
    validated_at: Optional[datetime]
    validated_via: Optional[ValidationSource]
    validated_via_class_session_id: Optional[str]
    skipped_at: Optional[datetime]
    skipped_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Validation auto** : quand `student_skill.validated=TRUE AND source='class_completion'` pour la skill du step, auto-passage `pending|in_progress → validated`
- **`status='in_progress'`** : set automatiquement quand l'étudiant s'inscrit à une class de `recommended_class_ids` (intent enrolment)
- **Recompute `student_learning_path.completion_pct`** à chaque transition de step
- **Steps non démarrés** quand path régénéré : ne sont pas conservés (nouveaux steps créés)
- **Step `validated`** non re-validable : verrouillé

## Relations

- **Référence** :
  - `path_id` → `student_learning_path.id` (CASCADE)
  - `skill_id` → `skill.id`
  - `validated_via_class_session_id` → `mira_class_session.id` (référence logique cross-groupe)

## Routes API

```
GET    /v1/students/me/learning-paths/{path_id}/steps                   — list (ordonnés)
GET    /v1/students/me/learning-paths/{path_id}/steps/{id}              — détail
POST   /v1/students/me/learning-paths/{path_id}/steps/{id}/validate     — valider manuellement
POST   /v1/students/me/learning-paths/{path_id}/steps/{id}/skip         — sauter
```

Internal (consommé par triggers post-class) :
```
POST   /internal/learning-paths/{path_id}/steps/auto-validate           — appelé quand class_completion détecté pour skill
```

## Seed attendu

Pour chaque `student_learning_path` seedé : 4-7 steps avec mix statuts (1-2 validés, 1 in_progress, reste pending). `recommended_class_ids` cohérent (3 classes du catalogue Group B seedées par skill).

## Reprenabilité

**Mapping** : `learn-api.learning_path_step` — schéma identique.

**Effort** : ~2h Claude Code (couplé migration learning_path).
