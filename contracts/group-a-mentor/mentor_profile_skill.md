# mentor_profile_skill

**Possédé par** : Group A (write)
**Reprenabilité post-hackathon** : migration vers `mentors-api.mentor_profile_skill`

## Description fonctionnelle

Skills déclarées par un mentor validé sur sa fiche publique. Reportées automatiquement depuis `mentor_application_skill` à la validation de la candidature, puis éditables par le mentor.

Le champ `primary` permet de marquer 1-3 skills mises en avant (affichées sur la vignette annuaire ; les autres apparaissent uniquement sur la fiche détail).

## Schéma SQL

```sql
CREATE TABLE mentor_profile_skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES mentor_profile(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,                                -- ref skill.id

    level VARCHAR(32) NOT NULL CHECK (level IN ('intermediate', 'advanced', 'expert')),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,             -- top 3 affichés en vignette annuaire
    display_order INTEGER NOT NULL DEFAULT 0,              -- pour ordonnancer dans la vignette

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (profile_id, skill_id)
);

CREATE INDEX idx_mentor_profile_skill_profile_id ON mentor_profile_skill (profile_id, is_primary DESC, display_order);
CREATE INDEX idx_mentor_profile_skill_skill_id ON mentor_profile_skill (skill_id);
CREATE INDEX idx_mentor_profile_skill_primary ON mentor_profile_skill (skill_id, profile_id)
    WHERE is_primary = TRUE;  -- pour filtre annuaire par skill primary
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

SkillLevel = Literal["intermediate", "advanced", "expert"]


class MentorProfileSkillBase(BaseModel):
    skill_id: str
    level: SkillLevel
    is_primary: bool = False
    display_order: int = Field(default=0, ge=0)


class MentorProfileSkillCreate(MentorProfileSkillBase):
    pass


class MentorProfileSkillUpdate(BaseModel):
    level: SkillLevel | None = None
    is_primary: bool | None = None
    display_order: int | None = Field(None, ge=0)


class MentorProfileSkillRead(MentorProfileSkillBase):
    id: str
    profile_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Maximum 3 skills `is_primary=TRUE`** par profil (validation service, soft warning sinon hard error)
- `UNIQUE (profile_id, skill_id)` : pas de doublons
- À la création du profil, reprise auto depuis `mentor_application_skill` avec les 3 premières skills `level='expert'` ou `'advanced'` marquées `is_primary=TRUE`

## Relations

- **Référence** :
  - `profile_id` → `mentor_profile.id` (CASCADE)
  - `skill_id` → `skill.id` (référence logique)

## Routes API

```
GET    /v1/mentors/me/skills                    — list mes skills
PUT    /v1/mentors/me/skills                    — set complète
POST   /v1/mentors/me/skills                    — ajouter une skill
PATCH  /v1/mentors/me/skills/{id}               — update (level, is_primary, order)
DELETE /v1/mentors/me/skills/{id}               — retirer
```

Public via annuaire :
```
GET    /v1/mentors/{slug}/skills                — skills publiques du mentor
GET    /v1/mentors?skill_id=...                 — filtrage annuaire par skill (utilise mentor_profile_skill JOIN)
```

## Seed attendu

Pour chaque `mentor_profile` seedé (15-20) : 4-8 skills avec :
- 2-3 `is_primary=TRUE` (cohérent avec le sujet principal du mentor)
- Reste `is_primary=FALSE`
- `level` distribué : ~50% expert, ~35% advanced, ~15% intermediate

## Reprenabilité

**Mapping** : `mentors-api.mentor_profile_skill` — schéma identique.

**Effort** : ~30 min (copie schéma + données).
