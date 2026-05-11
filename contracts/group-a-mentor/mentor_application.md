# mentor_application

**Possédé par** : Group A (write)
**Reprenabilité post-hackathon** : migration vers `mentors-api.mentor_application` (extension service backbone existant)

## Description fonctionnelle

Une candidature soumise par un user Hello Mira pour devenir Mira Mentor. Une candidature contient les éléments d'identité + parcours + skills du candidat, et est liée aux propositions de Mira Classes via les tables `mira_class` (status `draft/submitted`).

La candidature suit une state machine :
- `submitted` : candidat a cliqué "Soumettre" → en attente review admin
- `in_review` : admin a commencé à examiner (optionnel — peut sauter cette étape)
- `validated` : admin a accepté → un `mentor_profile` est créé en parallèle, les `mira_class` proposées passent en `validated_draft`
- `rejected` : admin a refusé → motif consigné, candidat peut re-postuler après 30 jours (règle métier non implémentée en hackathon)

Une seule candidature `submitted/in_review/validated` par `user_id` à la fois (contrainte unique partielle).

## Schéma SQL

```sql
CREATE TABLE mentor_application (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Identité candidat (ref Supabase auth.users.id, pas de FK SQL)
    user_id UUID NOT NULL,

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'in_review', 'validated', 'rejected'
    )),

    -- Identité (étape 1 du tunnel)
    first_name VARCHAR(80) NOT NULL DEFAULT '',
    last_name VARCHAR(80) NOT NULL DEFAULT '',
    nomad_since_year INTEGER NULL CHECK (nomad_since_year IS NULL OR (nomad_since_year >= 2000 AND nomad_since_year <= 2030)),
    prior_masterclasses_count INTEGER NOT NULL DEFAULT 0 CHECK (prior_masterclasses_count >= 0),

    -- Ingestion CV / LinkedIn (étape 2-3.1 — optionnelle, mais préremplit 3.2)
    -- FK logique vers mentor_cv_import(id), non-enforced en SQL pour éviter
    -- un ordre de création contraint dans Alembic (les contracts sont auto-extraits
    -- dans l'ordre alphabétique).
    cv_import_id UUID NULL,

    -- Contenu candidature (étape 3.2)
    bio TEXT NOT NULL DEFAULT '',                          -- markdown, ~500-2000 chars typiques
    professional_journey JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [
        --   {
        --     "role": "Head of Growth",
        --     "company": "Acme SaaS",
        --     "start_year": 2022, "end_year": 2024,
        --     "description": "..."
        --   },
        --   ...
        -- ]
    transmission_pitch TEXT NOT NULL DEFAULT '',           -- "ce que tu aimerais transmettre et pourquoi"
    motivation TEXT NOT NULL DEFAULT '',                   -- "Pourquoi devenir Mira Mentor ?", ~200-800 chars

    -- Liens externes (pour vérification + fiche publique post-validation)
    linkedin_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    website_url VARCHAR(255) NULL,

    -- Workflow review admin
    submitted_at TIMESTAMP WITH TIME ZONE NULL,            -- set quand status passe à 'submitted'
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,             -- set quand status passe à 'validated' ou 'rejected'
    reviewed_by_admin_id UUID NULL,                        -- ref Supabase auth.users.id (admin role)
    decision_reason TEXT NULL,                             -- justification admin (obligatoire si rejected)

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index pour lookup user → ma candidature en cours
CREATE INDEX idx_mentor_application_user_id ON mentor_application (user_id)
    WHERE deleted_at IS NULL;

-- Index pour filtrer le queue admin par status
CREATE INDEX idx_mentor_application_status ON mentor_application (status, submitted_at DESC)
    WHERE deleted_at IS NULL;

-- Unique partielle : un user ne peut avoir qu'une candidature active
CREATE UNIQUE INDEX uniq_mentor_application_active ON mentor_application (user_id)
    WHERE status IN ('draft', 'submitted', 'in_review') AND deleted_at IS NULL;
```

## Schéma Pydantic (FastAPI)

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict, HttpUrl

ApplicationStatus = Literal[
    "draft", "submitted", "in_review", "validated", "rejected"
]


class ProfessionalExperience(BaseModel):
    """Une étape de parcours professionnel."""
    role: str = Field(..., max_length=120)
    company: str = Field(..., max_length=120)
    start_year: int = Field(..., ge=1970, le=2030)
    end_year: Optional[int] = Field(None, ge=1970, le=2030)
    description: str = Field(default="", max_length=2000)


class MentorApplicationBase(BaseModel):
    first_name: str = Field(default="", max_length=80)
    last_name: str = Field(default="", max_length=80)
    nomad_since_year: Optional[int] = Field(None, ge=2000, le=2030)
    prior_masterclasses_count: int = Field(default=0, ge=0)
    cv_import_id: Optional[str] = None
    bio: str = Field(default="", max_length=5000)
    professional_journey: list[ProfessionalExperience] = []
    transmission_pitch: str = Field(default="", max_length=2000)
    motivation: str = Field(default="", max_length=2000)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    instagram_url: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)


class MentorApplicationCreate(MentorApplicationBase):
    """Création initiale en status='draft'."""
    pass


class MentorApplicationUpdate(MentorApplicationBase):
    """Update partiel pendant l'édition (avant submit)."""
    pass


class MentorApplicationSubmit(BaseModel):
    """Confirmation soumission (status draft → submitted)."""
    pass  # body vide


class MentorApplicationReviewDecision(BaseModel):
    """Décision admin."""
    decision: Literal["validated", "rejected"]
    decision_reason: Optional[str] = Field(None, max_length=2000)
    # decision_reason obligatoire si decision='rejected' (validation au service)


class MentorApplicationRead(MentorApplicationBase):
    id: str
    user_id: str
    status: ApplicationStatus
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    reviewed_by_admin_id: Optional[str]
    decision_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Une seule candidature active par user** (status `draft/submitted/in_review/validated`). L'unique index partiel l'enforce côté DB.
- **`status='rejected'`** : `decision_reason` obligatoire au moment de la transition. Validation côté service.
- **Transitions autorisées** (state machine stricte) :
  - `draft → submitted` : par le candidat
  - `draft → draft` : updates pendant l'édition
  - `submitted → in_review` : par admin (optionnel)
  - `submitted → validated|rejected` : par admin (direct possible)
  - `in_review → validated|rejected` : par admin
  - `validated → validated` : pas d'update post-validation (fiche éditée via `mentor_profile`)
  - `rejected → submitted` : pas autorisé pendant le hackathon (nouvelle candidature requise)
- **À la validation** (`status='validated'`) : créer un `mentor_profile` en parallèle (avec `slug` auto-généré depuis bio/parcours) + faire passer toutes les `mira_class` rattachées (via `mira_class.application_id`) de `submitted` → `validated_draft`.
- **Soft delete** : si un candidat veut annuler sa candidature avant review, on passe en `deleted_at = NOW()` (l'unique index partiel le permet alors qu'un autre candidature soit ouverte).

## Relations

- **Référencée par** (intra-Group A) :
  - `mentor_application_skill.application_id` → skills du candidat
  - `mentor_cv_import.application_id` → imports CV
  - `mira_class.application_id` (nullable) → classes proposées via cette candidature
  - `mira_class_ai_suggestion.application_id` → suggestions IA générées pour ce candidat
- **Référence** :
  - `user_id` → Supabase `auth.users.id` (pas de FK SQL — référence logique)
  - `reviewed_by_admin_id` → Supabase `auth.users.id` (admin role) — idem

## Routes API publiques exposées (Group A)

Le candidat manipule sa propre candidature (`/me`), l'admin valide depuis un endpoint dédié (mock hackathon : un toggle DB direct est acceptable, mais l'endpoint admin doit exister pour reprenabilité).

```
POST   /v1/mentors/applications              — créer (status='draft')
GET    /v1/mentors/applications/me           — ma candidature en cours
PATCH  /v1/mentors/applications/me           — update (uniquement si status='draft')
POST   /v1/mentors/applications/me/submit    — soumettre (draft → submitted)
DELETE /v1/mentors/applications/me           — annuler (soft delete, uniquement si status='draft')

# Admin (mock hackathon : auth role='admin')
GET    /v1/admin/mentors/applications        — queue review (filtre status)
GET    /v1/admin/mentors/applications/{id}   — détail
POST   /v1/admin/mentors/applications/{id}/review  — décision (validated|rejected)
```

## Seed attendu (Supabase Group A)

- **5 candidatures `submitted`** : candidats en cours de review, données réalistes (bio + parcours + skills + 1-2 classes proposées chacun)
- **2 candidatures `in_review`** : admin a commencé l'examen
- **1 candidature `rejected`** : pour démontrer le flow rejection (avec `decision_reason` documenté)
- Les 15-20 mentors `validated` du seed annuaire n'ont **pas besoin** de `mentor_application` correspondante (ils sont déjà passés par là dans l'historique fictif) — on peut seedés des `mentor_application` `validated` pour 3-5 d'entre eux à titre d'illustration

## Reprenabilité post-hackathon

**Mapping cible** : `mentors-api.mentor_application` (extension du service backbone existant `mentors-api`).

**Transformations à effectuer** :
1. Migrer schéma : ajouter colonnes `mentors-api.mentor_application` (alembic migration dédiée)
2. Copier les données depuis Supabase Group A → PostgreSQL `mentors-api`
3. Réécrire les endpoints en pattern Hello Mira :
   - JSend response format (déjà respecté)
   - HMAC pour les routes internes `/internal/*` (les calls admin deviennent HMAC depuis `admin-api`)
   - Scopes Hello Mira (`mentors:write:own`, `mentors:read:admin`, etc.)
4. Émettre NATS event `mentor.application.validated` à la transition → consumé par :
   - `mentors-api` (créer `mentor_profile`)
   - `classes-api` (faire passer les `mira_class` rattachées en `validated_draft`)
   - `messaging-api` (email "Bienvenue Mira Mentor")
   - `terms-api` (proposer signature contrat partenariat v1.1)
5. RGPD : conserver les candidatures `rejected` pendant 1 an puis purge (durée à confirmer cabinet juridique)

**Effort estimé** : ~3-4h Claude Code (avec génération auto Pydantic v2 + Alembic).
