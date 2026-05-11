# student_skill

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : migration vers `users-api.user_skill` ou nouveau service `learn-api.student_skill`

## Description fonctionnelle

Skills déjà acquises ou en cours d'acquisition par un étudiant. Permet de :
- Tracker la progression de l'étudiant (validation par class completion + QCM)
- Personnaliser le parcours (skills déjà maîtrisées → ne sont pas suggérées comme cibles)
- Afficher le CV apprenant

Source de validation :
- `self_declared` : déclaré par l'étudiant (auto-évaluation)
- `cv_import` : extrait par IA depuis CV
- `class_completion` : validé après complétion d'une class qui prodigue cette skill
- `quiz` : validé après réussite d'un QCM associé à cette skill
- `seed` : initial seed pour démo

## Schéma SQL

```sql
CREATE TABLE student_skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,                                -- ref skill.id

    level VARCHAR(32) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    validated BOOLEAN NOT NULL DEFAULT FALSE,              -- true = skill confirmée via class/quiz
    source VARCHAR(32) NOT NULL CHECK (source IN (
        'self_declared', 'cv_import', 'class_completion', 'quiz', 'seed'
    )),
    validated_at TIMESTAMP WITH TIME ZONE NULL,
    validation_evidence JSONB NULL,
        -- Schéma : {"class_id": "...", "session_id": "...", "quiz_id": "...", "score_pct": 85}

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (profile_id, skill_id)
);

CREATE INDEX idx_student_skill_profile_id ON student_skill (profile_id, validated);
CREATE INDEX idx_student_skill_skill_id ON student_skill (skill_id);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict

SkillLevel = Literal["beginner", "intermediate", "advanced", "expert"]
SkillSource = Literal["self_declared", "cv_import", "class_completion", "quiz", "seed"]


class StudentSkillBase(BaseModel):
    skill_id: str
    level: SkillLevel
    validated: bool = False
    source: SkillSource
    validation_evidence: Optional[dict[str, Any]] = None


class StudentSkillCreate(StudentSkillBase):
    pass


class StudentSkillUpdate(BaseModel):
    level: Optional[SkillLevel] = None
    validated: Optional[bool] = None
    source: Optional[SkillSource] = None
    validation_evidence: Optional[dict[str, Any]] = None


class StudentSkillRead(StudentSkillBase):
    id: str
    profile_id: str
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- `UNIQUE (profile_id, skill_id)` : 1 skill au plus par profil
- `validated=TRUE` + `source IN ('class_completion', 'quiz')` → `validated_evidence` obligatoire
- Si `validated=FALSE`, `validated_at` doit être NULL
- À chaque validation, écho dans `student_learning_path_step.status='validated'` si la skill correspond

## Relations

- **Référence** :
  - `profile_id` → `student_profile.id` (CASCADE)
  - `skill_id` → `skill.id`

## Routes API

```
GET    /v1/students/me/skills                  — list mes skills
POST   /v1/students/me/skills                  — ajouter (manuel)
PATCH  /v1/students/me/skills/{id}             — update (level, validated)
DELETE /v1/students/me/skills/{id}             — retirer
POST   /v1/students/me/skills/{id}/validate    — valider manuellement (self_declared → validated avec source change)
```

Internal (consommé par triggers post-class/post-quiz) :
```
POST   /internal/students/{user_id}/skills/validate-from-class    — trigger validation auto
POST   /internal/students/{user_id}/skills/validate-from-quiz     — trigger validation auto
```

## Seed attendu

Pour chaque `student_profile` seedé : 3-10 skills déjà acquises avec mix sources et niveaux.

## Reprenabilité

**Mapping** : `users-api.user_skill` ou nouveau `learn-api.student_skill` selon découpage final.

**Effort** : ~2h Claude Code.
