# mentor_profile

**Possédé par** : Group A (write — création à la validation candidature + édition fiche publique)
**Reprenabilité post-hackathon** : migration vers `mentors-api.mentor_profile`

## Description fonctionnelle

La fiche publique d'un Mira Mentor validé. Créée automatiquement à la transition `mentor_application.status: in_review → validated`. Visible publiquement via slug : `/mentors/{slug}`.

Contient :
- Identité publique (display_name, headline, bio, avatar)
- Parcours professionnel (timeline)
- Liens externes (LinkedIn, Instagram, site)
- Stats dénormalisées (rating moyenne, nombre de classes) seedées hackathon
- Status (active / paused / archived)

Le mentor peut éditer sa fiche depuis un dashboard (Group A volet privé éventuel post-validation, ou Group B selon découpage final).

## Schéma SQL

```sql
CREATE TABLE mentor_profile (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,                          -- ref Supabase auth.users.id (1:1)

    -- URL publique
    slug VARCHAR(120) NOT NULL UNIQUE,                     -- ex : "marie-dupont", auto-généré

    -- Identité publique
    display_name VARCHAR(120) NOT NULL,
    headline VARCHAR(255) NOT NULL DEFAULT '',             -- bio courte affichée en vignette annuaire
    bio TEXT NOT NULL DEFAULT '',                          -- markdown, long form
    avatar_url VARCHAR(500) NULL,                          -- URL Supabase Storage
    cover_url VARCHAR(500) NULL,                           -- URL image de couverture optionnelle

    -- Parcours
    professional_journey JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [
        --   {"role": "...", "company": "...", "start_year": 2022, "end_year": 2024, "description": "..."},
        --   ...
        -- ]

    -- Liens sociaux
    linkedin_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    website_url VARCHAR(255) NULL,

    -- Status
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

    -- Stats dénormalisées (seedées hackathon, en V1 prod = vue matérialisée nightly)
    aggregate_rating NUMERIC(3, 2) NULL CHECK (aggregate_rating BETWEEN 0 AND 5),
        -- moyenne sur les 4 sous-axes
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    classes_given_count INTEGER NOT NULL DEFAULT 0 CHECK (classes_given_count >= 0),

    -- Audit
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),    -- set à création (= moment validation candidature)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX uniq_mentor_profile_user_id ON mentor_profile (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uniq_mentor_profile_slug ON mentor_profile (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_mentor_profile_status ON mentor_profile (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_mentor_profile_rating ON mentor_profile (aggregate_rating DESC NULLS LAST) WHERE deleted_at IS NULL;
CREATE INDEX idx_mentor_profile_classes_count ON mentor_profile (classes_given_count DESC) WHERE deleted_at IS NULL;
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

MentorProfileStatus = Literal["active", "paused", "archived"]


class ProfessionalExperience(BaseModel):
    role: str = Field(..., max_length=120)
    company: str = Field(..., max_length=120)
    start_year: int = Field(..., ge=1970, le=2030)
    end_year: Optional[int] = Field(None, ge=1970, le=2030)
    description: str = Field(default="", max_length=2000)


class MentorProfileBase(BaseModel):
    display_name: str = Field(..., max_length=120)
    headline: str = Field(default="", max_length=255)
    bio: str = Field(default="", max_length=10000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    cover_url: Optional[str] = Field(None, max_length=500)
    professional_journey: list[ProfessionalExperience] = []
    linkedin_url: Optional[str] = Field(None, max_length=255)
    instagram_url: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)


class MentorProfileCreate(MentorProfileBase):
    """Création via validation candidature (interne, pas exposé publiquement)."""
    user_id: str
    slug: str = Field(..., max_length=120, pattern=r"^[a-z0-9-]+$")


class MentorProfileUpdate(BaseModel):
    """Édition par le mentor depuis son dashboard."""
    display_name: Optional[str] = Field(None, max_length=120)
    headline: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=10000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    cover_url: Optional[str] = Field(None, max_length=500)
    professional_journey: Optional[list[ProfessionalExperience]] = None
    linkedin_url: Optional[str] = Field(None, max_length=255)
    instagram_url: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)
    status: Optional[MentorProfileStatus] = None


class MentorProfileRead(MentorProfileBase):
    id: str
    user_id: str
    slug: str
    status: MentorProfileStatus
    aggregate_rating: Optional[Decimal]
    rating_count: int
    classes_given_count: int
    validated_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MentorProfilePublic(BaseModel):
    """Vue publique (catalogue + fiche /mentors/{slug}). Restreinte par rapport à Read."""
    id: str
    slug: str
    display_name: str
    headline: str
    bio: str
    avatar_url: Optional[str]
    cover_url: Optional[str]
    professional_journey: list[ProfessionalExperience]
    linkedin_url: Optional[str]
    instagram_url: Optional[str]
    website_url: Optional[str]
    aggregate_rating: Optional[Decimal]
    rating_count: int
    classes_given_count: int
```

## Contraintes métier

- **Slug auto-généré** à la création : `slugify(display_name)` + suffixe `-2`, `-3`... si conflit (UNIQUE constraint)
- **1:1 avec user** : un user ne peut avoir qu'un seul `mentor_profile` actif (`uniq_mentor_profile_user_id` partiel)
- **Status `active` requis** pour apparaître dans l'annuaire public
- **Stats dénormalisées** : seedées hackathon, recalculées V1 prod via cron nightly (NATS events `rate.rate.published` et `class.session.completed`)
- **Soft delete uniquement** (mentor archive sa fiche, ne se supprime jamais physiquement avant 3 ans — RGPD)

## Relations

- **Référence** :
  - `user_id` → Supabase `auth.users.id` (référence logique 1:1)
- **Référencée par** :
  - `mentor_profile_skill.profile_id` (skills du mentor pour annuaire)
  - `mentor_rating_breakdown.profile_id` (détail rating par sous-axe)
  - `mira_class.mentor_user_id` = `mentor_profile.user_id` (pas `mentor_profile.id` — référence par Supabase user_id, plus stable et cross-services)

## Routes API

### Public (anonyme ou auth)
```
GET    /v1/mentors                              — annuaire (filtres : category, skill_id ; tri : rating, classes_count, alphabetical)
GET    /v1/mentors/{slug}                       — fiche publique
GET    /v1/mentors/{slug}/classes               — classes published de ce mentor (proxy classes-api en V1 prod)
```

### Privé (mentor connecté)
```
GET    /v1/mentors/me                           — ma fiche
PATCH  /v1/mentors/me                           — édition (display_name, bio, etc.)
POST   /v1/mentors/me/avatar                    — upload avatar (Supabase Storage)
POST   /v1/mentors/me/status                    — changer status (active|paused|archived)
```

### Internal (trigger validation candidature)
```
POST   /internal/mentor-profiles                — créé à partir d'une mentor_application validée (HMAC)
```

## Seed attendu

**15-20 mentor_profile `active`** avec stats variées :
- `aggregate_rating` de 3.2 à 4.9 (distribution réaliste : la plupart entre 4.0-4.7, quelques outliers)
- `classes_given_count` de 0 à 47 (mix : nouveaux mentors 0-3 classes, intermédiaires 5-15, top mentors 20-50)
- `rating_count` cohérent avec classes_given_count
- 5 catégories de skills réparties équitablement
- Slugs réalistes (ex : "marie-dupont", "antoine-martin", "anna-rodriguez")
- Avatars stub (placeholder.com avec seed reproductible)
- Bios + parcours réalistes (3-5 expériences chacun)

## Reprenabilité

**Mapping** : `mentors-api.mentor_profile` — extension service backbone existant.

**Transformations** :
1. Migrer schéma + données depuis Supabase Group A → PostgreSQL `mentors-api`
2. Stats `aggregate_rating`/`rating_count`/`classes_given_count` deviennent des **vues matérialisées** alimentées par :
   - NATS event `rate.rate.published` (consume par mentors-api) → recompute `aggregate_rating` et `rating_count` via `rates-api` aggregate
   - NATS event `class.session.completed` (consume par mentors-api) → increment `classes_given_count`
   - Refresh cron nightly pour cohérence
3. Avatars stub → migration vers `files-api` S3 OVH (URL signées 5min)
4. Slugs : conserver tels quels (déjà conformes)
5. RGPD : conserver pendant 3 ans après dernière activité, puis anonymisation (display_name, bio, journey → null, avatar supprimé)

**Effort** : ~3-4h Claude Code (table centrale).
