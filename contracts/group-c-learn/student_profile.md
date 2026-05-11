# student_profile

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : migration vers `users-api` (extension du profil utilisateur Hello Mira existant — pas un service séparé)

## Description fonctionnelle

Profil étudiant pour Mira Learn — extension du profil Hello Mira générique. Le nomad renseigne sa bio, son parcours pro, ses skills déjà acquises, et ses **objectifs d'apprentissage** (skills à acquérir + horizon temporel).

Le profil alimente :
- Le moteur de génération de parcours `student_learning_path` (Group C)
- La fiche personnelle visible dans la cohort par les autres apprenants (Group D)
- Le matching `matching-api` post-hackathon

## Schéma SQL

```sql
CREATE TABLE student_profile (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,                          -- ref Supabase auth.users.id

    -- Identité
    display_name VARCHAR(120) NOT NULL,
    headline VARCHAR(255) NOT NULL DEFAULT '',             -- bio courte affichée en cohort
    bio TEXT NOT NULL DEFAULT '',                          -- markdown
    avatar_url VARCHAR(500) NULL,

    -- Parcours
    professional_journey JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- même schéma que mentor_profile.professional_journey

    -- Liens sociaux (optionnels)
    linkedin_url VARCHAR(255) NULL,
    twitter_url VARCHAR(255) NULL,
    website_url VARCHAR(255) NULL,

    -- Objectifs apprentissage
    target_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [skill_id, skill_id, ...]
    learning_horizon VARCHAR(16) NULL CHECK (learning_horizon IS NULL OR learning_horizon IN (
        '3_months', '6_months', '1_year', '2_years'
    )),
    motivation TEXT NOT NULL DEFAULT '',                   -- "Pourquoi tu veux apprendre ?", utilisé par IA pour personnaliser parcours

    -- Préférences
    preferred_formats JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- ['physical', 'virtual', 'both']
    preferred_destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- ['Barcelona', 'Lisbon', 'Bali', ...] — pour sessions physiques
    timezone VARCHAR(64) NULL,                             -- ex 'Europe/Paris'

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX uniq_student_profile_user_id ON student_profile (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_profile_target_skills ON student_profile USING gin (target_skills);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

LearningHorizon = Literal["3_months", "6_months", "1_year", "2_years"]
ClassFormat = Literal["physical", "virtual", "both"]


class ProfessionalExperience(BaseModel):
    role: str = Field(..., max_length=120)
    company: str = Field(..., max_length=120)
    start_year: int = Field(..., ge=1970, le=2030)
    end_year: Optional[int] = Field(None, ge=1970, le=2030)
    description: str = Field(default="", max_length=2000)


class StudentProfileBase(BaseModel):
    display_name: str = Field(..., max_length=120)
    headline: str = Field(default="", max_length=255)
    bio: str = Field(default="", max_length=10000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    professional_journey: list[ProfessionalExperience] = []
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    target_skills: list[str] = []                          # liste skill_id
    learning_horizon: Optional[LearningHorizon] = None
    motivation: str = Field(default="", max_length=2000)
    preferred_formats: list[ClassFormat] = []
    preferred_destinations: list[str] = []
    timezone: Optional[str] = None


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=120)
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    professional_journey: Optional[list[ProfessionalExperience]] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    target_skills: Optional[list[str]] = None
    learning_horizon: Optional[LearningHorizon] = None
    motivation: Optional[str] = None
    preferred_formats: Optional[list[ClassFormat]] = None
    preferred_destinations: Optional[list[str]] = None
    timezone: Optional[str] = None


class StudentProfileRead(StudentProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- 1:1 user (`uniq_student_profile_user_id`)
- `target_skills` : 1-10 skills cibles max (validation service)
- `learning_horizon` requis si `target_skills` non vide (pour génération parcours)
- Modification `target_skills` ou `learning_horizon` → invalide les `student_learning_path` actifs (regen automatique proposée)

## Relations

- **Référence** : `user_id` → Supabase `auth.users.id`
- **Référencée par** :
  - `student_skill.profile_id`
  - `student_cv_import.profile_id`
  - `student_enrolment_intent.profile_id`
  - `student_learning_path.profile_id`

## Routes API

```
POST   /v1/students/profiles                — créer
GET    /v1/students/me                      — mon profil
PATCH  /v1/students/me                      — update
POST   /v1/students/me/avatar               — upload avatar Supabase Storage
DELETE /v1/students/me                      — soft delete
```

## Seed attendu

- 10 student_profile seedés avec :
  - Auth Supabase pré-créé (`nomad1@hackathon.test`...`nomad10@hackathon.test`, password `Hackathon2026!`)
  - Profils variés (bio + journey réalistes)
  - 3-8 `target_skills` chacun
  - `learning_horizon` distribué
  - 1-2 nomads sans `target_skills` (pour démontrer le flow "définis tes objectifs")

## Reprenabilité

**Mapping** : extension `users-api` — ajouter une table associée `users-api.student_learning_profile` ou intégrer les champs Mira Learn-specific (`target_skills`, `learning_horizon`, `motivation`, `preferred_*`) dans la table `users-api.user` principale.

**Transformations** :
1. Merger les champs `display_name`, `bio`, `avatar_url`, `professional_journey` avec le profil user Hello Mira global (probablement déjà présents)
2. Ajouter les champs Mira Learn dans `users-api.user_learning_profile` (nouvelle table)
3. Refresh frontend selon le découpage final

**Effort** : ~3h Claude Code.
