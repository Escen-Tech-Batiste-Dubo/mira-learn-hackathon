# mira_class

**Possédé par** : Group A (write — création + soumission), Group B (write — enrichissement post-validation)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class` (extension service backbone existant)

## Description fonctionnelle

L'entité centrale de Mira Learn : une **Mira Class** est un programme pédagogique animé par un mentor sur un sujet donné, structuré en modules. Une Mira Class peut avoir plusieurs sessions (instances datées) auxquelles les nomads s'inscrivent.

Cycle de vie en 2 phases :
1. **Phase candidature (Group A)** : Le mentor propose la class pendant sa candidature → statuts `draft → submitted → validated_draft|rejected`
2. **Phase opérationnelle (Group B)** : Une fois `validated_draft`, le mentor enrichit modules + matériel + QCM, puis publie → statuts `validated_draft → enrichment_in_progress → published → archived`

Group A possède la "coquille" (titre, description, skills_taught, programme grossier), Group B possède le "contenu détaillé" (modules enrichis, sessions, matériel, QCM).

## Schéma SQL

```sql
CREATE TABLE mira_class (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Liens
    application_id UUID NULL REFERENCES mentor_application(id) ON DELETE SET NULL,
        -- Conserve la trace de la candidature d'origine après validation.
        -- Devient NULL uniquement si la candidature est supprimée pour RGPD
        -- (le ON DELETE SET NULL protège la mira_class qui survit).
    mentor_user_id UUID NOT NULL,
        -- ref Supabase auth.users.id du mentor — ne change jamais après création
        -- (= mentor_profile.user_id, pas mentor_profile.id)

    -- Identité
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',                 -- markdown
    skills_taught JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [skill_id (UUID), skill_id, ...] — référence skill.id

    -- Charge horaire (étape 6 du tunnel — granularité collectif / individuel)
    total_hours_collective INTEGER NOT NULL DEFAULT 0 CHECK (total_hours_collective >= 0),
    total_hours_individual INTEGER NOT NULL DEFAULT 0 CHECK (total_hours_individual >= 0),
    total_hours INTEGER NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
        -- Souvent = collective + individual mais le mentor peut le forcer.

    -- Format + rythme + villes envisagées (étape 5)
    format_envisaged VARCHAR(16) NOT NULL DEFAULT 'both' CHECK (format_envisaged IN (
        'physical', 'virtual', 'both'
    )),
    rythm_pattern VARCHAR(32) NULL CHECK (rythm_pattern IS NULL OR rythm_pattern IN (
        'weekly_session', 'biweekly_session', 'monthly_workshop', 'intensive_weekend', 'self_paced'
    )),
    target_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Liste de villes envisagées (format physical / hybrid).
        -- Schéma : [{"name": "Lisbonne", "country_code": "PT"}, ...]

    -- Pricing recommandé saisi par le mentor (étape 6 — la simulation revenus est calculée à la volée)
    recommended_price_per_hour_collective_cents BIGINT NOT NULL DEFAULT 0 CHECK (recommended_price_per_hour_collective_cents >= 0),
    recommended_price_per_hour_individual_cents BIGINT NOT NULL DEFAULT 0 CHECK (recommended_price_per_hour_individual_cents >= 0),
        -- Simulation revenu (non stockée, calculée à la volée pour éviter incohérence) :
        --   gross_revenue = hours_collective × rate_collective × capacity_min + hours_individual × rate_individual
        --   platform_fee  = gross_revenue × 0.25  (marge plateforme)
        --   mentor_net    = gross_revenue × 0.75

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'in_review', 'validated_draft',
        'enrichment_in_progress', 'published', 'rejected', 'archived'
    )),
    rejection_reason TEXT NULL,                            -- obligatoire si status='rejected'

    -- IA tracking
    ai_assisted BOOLEAN NOT NULL DEFAULT FALSE,            -- TRUE si créée à partir d'une suggestion IA
    source_suggestion_id UUID NULL,                        -- ref mira_class_ai_suggestion.id

    -- Audit
    submitted_at TIMESTAMP WITH TIME ZONE NULL,            -- set quand status passe à 'submitted'
    validated_at TIMESTAMP WITH TIME ZONE NULL,            -- set quand status passe à 'validated_draft'
    published_at TIMESTAMP WITH TIME ZONE NULL,            -- set par Group B quand published
    archived_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_mira_class_mentor_user_id ON mira_class (mentor_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_status ON mira_class (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_application_id ON mira_class (application_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_skills_taught ON mira_class USING gin (skills_taught);  -- recherche par skill
CREATE INDEX idx_mira_class_published ON mira_class (status, published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;  -- pour catalogue
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

MiraClassStatus = Literal[
    "draft", "submitted", "in_review", "validated_draft",
    "enrichment_in_progress", "published", "rejected", "archived"
]
ClassFormat = Literal["physical", "virtual", "both"]


RythmPattern = Literal["weekly_session", "biweekly_session", "monthly_workshop", "intensive_weekend", "self_paced"]


class TargetCity(BaseModel):
    name: str = Field(..., max_length=120)
    country_code: str = Field(..., min_length=2, max_length=2)


class MiraClassBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=10000)
    skills_taught: list[str] = []                          # liste de skill_id
    total_hours_collective: int = Field(default=0, ge=0)
    total_hours_individual: int = Field(default=0, ge=0)
    total_hours: int = Field(default=0, ge=0)
    format_envisaged: ClassFormat = "both"
    rythm_pattern: Optional[RythmPattern] = None
    target_cities: list[TargetCity] = []
    recommended_price_per_hour_collective_cents: int = Field(default=0, ge=0)
    recommended_price_per_hour_individual_cents: int = Field(default=0, ge=0)


class MiraClassCreate(MiraClassBase):
    """Création pendant candidature (Group A). status='draft' implicite."""
    application_id: Optional[str] = None
    ai_assisted: bool = False
    source_suggestion_id: Optional[str] = None


class MiraClassUpdate(BaseModel):
    """Update pendant édition (Group A en draft, Group B en validated_draft+)."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=10000)
    skills_taught: Optional[list[str]] = None
    total_hours: Optional[int] = Field(None, ge=0)
    format_envisaged: Optional[ClassFormat] = None


class MiraClassReviewDecision(BaseModel):
    """Décision admin (à la validation candidature)."""
    decision: Literal["validated_draft", "rejected"]
    rejection_reason: Optional[str] = Field(None, max_length=2000)


class MiraClassPublish(BaseModel):
    """Publication par mentor (Group B). Body vide."""
    pass


class MiraClassRead(MiraClassBase):
    id: str
    application_id: Optional[str]
    mentor_user_id: str
    status: MiraClassStatus
    rejection_reason: Optional[str]
    ai_assisted: bool
    source_suggestion_id: Optional[str]
    submitted_at: Optional[datetime]
    validated_at: Optional[datetime]
    published_at: Optional[datetime]
    archived_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

### State machine (transitions autorisées)

| De | Vers | Acteur | Conditions |
|---|---|---|---|
| `draft` | `draft` | Group A : candidat | Updates pendant édition |
| `draft` | `submitted` | Group A : candidat | Via `POST /applications/me/submit` (groupé avec candidature) |
| `submitted` | `in_review` | Admin | Optionnel |
| `submitted` | `validated_draft` | Admin | À la validation candidature |
| `submitted` | `rejected` | Admin | `rejection_reason` obligatoire |
| `in_review` | `validated_draft` | Admin | |
| `in_review` | `rejected` | Admin | `rejection_reason` obligatoire |
| `validated_draft` | `enrichment_in_progress` | Group B : mentor | Premier ajout de module |
| `enrichment_in_progress` | `published` | Group B : mentor | Via `POST /classes/{id}/publish` (au moins 1 module + 1 session prête) |
| `published` | `archived` | Group B : mentor | Soft archive |
| n'importe | `deleted_at IS NOT NULL` | Mentor/admin | Soft delete |

### Règles métier

- `skills_taught` doit contenir entre 1 et 5 skills (validation côté service)
- Si `status = 'rejected'`, `rejection_reason` est obligatoire
- Au passage `validated_draft → enrichment_in_progress` : log automatique
- Au passage en `published` : Group B vérifie qu'il y a au moins 1 `mira_class_module` et 1 `mira_class_session` avec `status='planned'`
- Le `mentor_user_id` est **immuable** après création (transfert mentor pas autorisé)
- Le `title` peut être modifié uniquement en `draft` ou `validated_draft` (pas après publication)

## Relations

- **Référence** :
  - `application_id` → `mentor_application.id` (SET NULL on delete)
  - `mentor_user_id` → Supabase `auth.users.id` (référence logique)
  - `source_suggestion_id` → `mira_class_ai_suggestion.id` (référence logique)
  - `skills_taught[]` → `skill.id` (JSONB array, référence logique)
- **Référencée par** :
  - **Group A** : `mira_class_module_outline.class_id` (programme grossier)
  - **Group B** : `mira_class_module.class_id`, `mira_class_session.class_id`

## Routes API

### Pendant candidature (Group A) — `/v1/mentors/applications/me/classes/*`

```
POST   /v1/mentors/applications/me/classes                  — créer une proposition (status='draft')
GET    /v1/mentors/applications/me/classes                  — list mes propositions sur cette candidature
GET    /v1/mentors/applications/me/classes/{id}             — détail
PATCH  /v1/mentors/applications/me/classes/{id}             — update (uniquement si status='draft')
DELETE /v1/mentors/applications/me/classes/{id}             — supprimer (uniquement si status='draft')

# Soumission groupée (candidature + propositions classes)
POST   /v1/mentors/applications/me/submit                   — passe candidature + toutes ses classes en 'submitted'
```

### Admin review

```
GET    /v1/admin/mentors/applications/{id}/classes          — list classes proposées par cette candidature
POST   /v1/admin/mentors/applications/{id}/review           — décision globale (peut accepter candidature mais rejeter des classes individuelles → status par class géré)
```

### Post-validation (Group B) — `/v1/classes/*`

```
GET    /v1/classes/me                                       — mes classes (mentor)
GET    /v1/classes/{id}                                     — détail
PATCH  /v1/classes/{id}                                     — update (ajustements titre/description si pas published)
POST   /v1/classes/{id}/publish                             — publier (enrichment_in_progress → published)
POST   /v1/classes/{id}/archive                             — archiver
DELETE /v1/classes/{id}                                     — soft delete

# Public (consommé par Group C catalogue)
GET    /v1/classes                                          — catalogue (filtres : skills, format, mentor)
GET    /v1/classes/{id}/public                              — fiche publique d'une class published
```

## Seed attendu

### Supabase Group A
- **Propositions associées aux candidatures seedées** : pour chaque candidature `submitted` (5), 1-3 `mira_class` proposées en status `submitted`
- **Propositions associées aux candidatures `in_review` (2)** : 1-2 classes chacune
- **Propositions associées aux candidatures `rejected` (1)** : 1-2 classes en status `rejected` avec `rejection_reason`

### Supabase Group B (read-only seed)
- **15-20 mira_class `validated_draft` ou `published`** : pour les mentors validés. Mix réaliste :
  - 5 en `validated_draft` (nouvellement validés, prêts à enrichir — démo flow d'enrichissement)
  - 10 en `published` (déjà opérationnelles, avec modules + sessions seedés ailleurs)
  - 2-3 en `enrichment_in_progress`

Tous reliés à un `mentor_user_id` cohérent avec les `mentor_profile.user_id` seedés.

## Reprenabilité

**Mapping** : `classes-api.mira_class` (extension du service backbone existant).

**Transformations** :
1. Merger les schémas `mira_class` des 2 Supabase Group A + Group B en une seule table dans `classes-api`
2. Réconcilier les statuts : Group A possède `draft|submitted|validated_draft|rejected`, Group B possède `validated_draft|enrichment_in_progress|published|archived` — l'union forme la state machine V1 prod complète
3. Ajouter colonnes Hello Mira backbone :
   - `i18n_translations` (JSONB) pour EN/ES V1.5
   - `metadata` JSONB pour features futures
4. Émettre NATS events à chaque transition status :
   - `class.class.submitted` (consume admin-api)
   - `class.class.validated` (consume mentors-api → activate mentor_profile + email)
   - `class.class.published` (consume matching-api → indexer pour reco)
   - `class.class.archived`
5. Endpoints publics → catalogue via edge-gateway + scopes Hello Mira (`classes:read:public`, `classes:write:own`)

**Effort** : ~5-6h Claude Code (table centrale, plus de logique state machine à formaliser).
