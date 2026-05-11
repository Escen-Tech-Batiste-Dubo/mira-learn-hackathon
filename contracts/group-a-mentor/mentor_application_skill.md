# mentor_application_skill

**Possédé par** : Group A (write)
**Reprenabilité post-hackathon** : migration vers `mentors-api.mentor_application_skill`

## Description fonctionnelle

Table de jointure entre une candidature mentor (`mentor_application`) et les skills déclarées par le candidat (référentiel `skill`). Permet de tracer le niveau auto-déclaré + la source (saisie manuelle vs extraction CV par IA).

À la validation de la candidature, ces skills sont reportées vers `mentor_profile_skill` (Group A) avec un champ `primary` à choisir.

## Schéma SQL

```sql
CREATE TABLE mentor_application_skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES mentor_application(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,                                -- ref shared.skill.id (pas de FK DB hackathon)

    level VARCHAR(32) NOT NULL CHECK (level IN (
        'intermediate', 'advanced', 'expert'
    )),
    self_declared BOOLEAN NOT NULL DEFAULT TRUE,           -- TRUE si saisi manuellement
    validated_via_cv_import BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE si extrait par IA depuis CV

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (application_id, skill_id)
);

CREATE INDEX idx_mentor_application_skill_application_id ON mentor_application_skill (application_id);
CREATE INDEX idx_mentor_application_skill_skill_id ON mentor_application_skill (skill_id);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict

SkillLevel = Literal["intermediate", "advanced", "expert"]


class MentorApplicationSkillBase(BaseModel):
    skill_id: str
    level: SkillLevel
    self_declared: bool = True
    validated_via_cv_import: bool = False


class MentorApplicationSkillCreate(MentorApplicationSkillBase):
    pass


class MentorApplicationSkillRead(MentorApplicationSkillBase):
    id: str
    application_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- `UNIQUE (application_id, skill_id)` : un candidat ne peut déclarer la même skill 2× sur sa candidature
- `level` reflète l'auto-déclaration du candidat — pas de validation externe pendant le hackathon
- Si `validated_via_cv_import=TRUE`, le candidat a confirmé la skill extraite par IA (n'est jamais auto-validé sans clic confirmation)
- À la suppression d'une candidature, les skills associées sont supprimées en cascade

## Relations

- **Référence** :
  - `application_id` → `mentor_application.id` (CASCADE)
  - `skill_id` → `skill.id` (référence logique, pas FK DB)
- **Référencée par** : aucune (table feuille)

## Routes API

```
GET    /v1/mentors/applications/me/skills              — mes skills déclarées
PUT    /v1/mentors/applications/me/skills              — set complète (remplace toutes les skills)
POST   /v1/mentors/applications/me/skills              — ajouter une skill
DELETE /v1/mentors/applications/me/skills/{skill_id}   — retirer une skill
```

## Seed attendu

Pour chaque candidature seedée (5 `submitted` + 2 `in_review` + 1 `rejected`), entre 3 et 8 skills déclarées avec mix `self_declared`/`validated_via_cv_import` et niveau varié.

## Reprenabilité

**Mapping** : `mentors-api.mentor_application_skill` — schéma identique, migration directe.

**Effort** : ~30 min (copie schéma + données).
