"""0001 — group-a-mentor schema (auto-généré depuis contracts/)

Migration produite par hackathon/seeds/build_schema_migrations.py.
NE PAS éditer à la main : régénérer le script et re-runner.

Inclut :
  - shared/ (skill)
  - contracts/group-a-mentor/ (tables propres au groupe)
  - tables cross-groupe référencées (sans FK enforced)

Revision ID: 0001a
Revises:
Create Date: 2026-05-11
"""
from alembic import op

revision = "0001a"
down_revision = None
branch_labels = None
depends_on = None


SCHEMA_SQL = r"""
-- Extensions Postgres requises par les contracts
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(32) NOT NULL CHECK (category IN (
        'business', 'design', 'tech', 'soft', 'lifestyle'
    )),
    popularity_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_skill_category ON skill (category) WHERE deleted_at IS NULL;
CREATE INDEX idx_skill_popularity ON skill (popularity_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_skill_name_trgm ON skill USING gin (name gin_trgm_ops);  -- recherche fuzzy

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

CREATE TABLE mentor_cv_import (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES mentor_application(id) ON DELETE CASCADE,

    -- Source du CV
    source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('pdf', 'linkedin_url', 'manual_paste')),
    file_url VARCHAR(500) NULL,                            -- URL fichier dans Supabase Storage (si pdf)
    source_url VARCHAR(500) NULL,                          -- URL LinkedIn ou autre (si linkedin_url)
    raw_text TEXT NULL,                                    -- texte brut OCR/parse (si manual_paste ou intermédiaire)

    -- Lifecycle extraction
    status VARCHAR(32) NOT NULL DEFAULT 'uploaded' CHECK (status IN (
        'uploaded', 'extracting', 'extracted', 'validated', 'failed'
    )),
    error_message TEXT NULL,                               -- raison de l'échec si status='failed'

    -- Résultats IA
    extracted_experiences_raw JSONB NULL,
        -- Schéma : [
        --   {"role": "Head of Growth", "company": "Acme", "start_year": 2022, "end_year": 2024, "description": "..."},
        --   ...
        -- ]
    extracted_skills_raw JSONB NULL,
        -- Schéma : [
        --   {"skill_slug": "pitch-investor", "level": "advanced", "confidence": 0.85, "evidence": "Pitch decks for ..."},
        --   ...
        -- ]

    -- Données validées par le candidat (après ajustement)
    validated_experiences JSONB NULL,                      -- même schéma que extracted_experiences_raw
    validated_skills JSONB NULL,                           -- même schéma que extracted_skills_raw

    -- Audit
    extracted_at TIMESTAMP WITH TIME ZONE NULL,            -- set quand status passe à 'extracted'
    validated_at TIMESTAMP WITH TIME ZONE NULL,            -- set quand status passe à 'validated'
    llm_model_used VARCHAR(64) NULL,                       -- ex 'anthropic/claude-3.5-sonnet'
    llm_tokens_consumed INTEGER NULL,                      -- audit coût OpenRouter

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_mentor_cv_import_application_id ON mentor_cv_import (application_id);
CREATE INDEX idx_mentor_cv_import_status ON mentor_cv_import (status) WHERE deleted_at IS NULL;

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

CREATE TABLE mentor_rating_breakdown (
    profile_id UUID NOT NULL PRIMARY KEY REFERENCES mentor_profile(id) ON DELETE CASCADE,

    -- 4 sous-axes (NULL si pas assez de reviews — quorum public ≥3 sessions)
    axis_pedagogy NUMERIC(3, 2) NULL CHECK (axis_pedagogy BETWEEN 0 AND 5),
    axis_presence NUMERIC(3, 2) NULL CHECK (axis_presence BETWEEN 0 AND 5),
    axis_deliverable NUMERIC(3, 2) NULL CHECK (axis_deliverable BETWEEN 0 AND 5),
    axis_community NUMERIC(3, 2) NULL CHECK (axis_community BETWEEN 0 AND 5),

    -- Trend (snapshot, comparaison vs période précédente — utile en V1.5)
    trend_3m_vs_6m_pct NUMERIC(5, 2) NULL,                 -- pourcentage de variation

    rating_count INTEGER NOT NULL DEFAULT 0,               -- même valeur que mentor_profile.rating_count (denorm)
    last_review_at TIMESTAMP WITH TIME ZONE NULL,

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

CREATE TABLE mira_class_ai_suggestion (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES mentor_application(id) ON DELETE CASCADE,

    -- Contenu suggéré
    suggested_title VARCHAR(200) NOT NULL,
    suggested_description TEXT NOT NULL DEFAULT '',
    suggested_skill_ids JSONB NOT NULL DEFAULT '[]'::jsonb,   -- list de skill.id que la class prodiguerait
    suggested_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [{"position": 1, "title": "...", "estimated_duration_hours": 2.0}, ...]
    suggested_total_hours INTEGER NOT NULL DEFAULT 0,
    suggested_format VARCHAR(16) NOT NULL CHECK (suggested_format IN ('physical', 'virtual', 'both')),

    -- Argumentaire IA
    justification TEXT NOT NULL,                              -- "Tu maîtrises X, 47 étudiants veulent apprendre X, seulement 2 mentors actifs..."
    skill_demand_score NUMERIC(5, 2) NOT NULL,                -- agrégat demande étudiants pour les skills suggérées
    skill_offer_gap_score NUMERIC(5, 2) NOT NULL,             -- gap demande/offre (plus haut = meilleur opportunité mentor)

    -- Lifecycle
    status VARCHAR(32) NOT NULL DEFAULT 'proposed' CHECK (status IN (
        'proposed', 'adopted', 'rejected', 'modified'
    )),
    adopted_into_class_id UUID NULL REFERENCES mira_class(id) ON DELETE SET NULL,
        -- set quand status='adopted' ou 'modified' (référence la mira_class créée à partir de la suggestion)
    rejected_at TIMESTAMP WITH TIME ZONE NULL,
    rejected_reason VARCHAR(64) NULL CHECK (rejected_reason IN (
        'not_my_expertise', 'not_interested', 'too_generic', 'duplicate', 'other'
    )),

    -- IA tracking (audit coût)
    llm_model_used VARCHAR(64) NOT NULL,                      -- ex 'anthropic/claude-3.5-sonnet'
    llm_tokens_consumed INTEGER NULL,
    generation_prompt_hash VARCHAR(64) NULL,                  -- hash du prompt pour debug + déduplication

    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mira_class_ai_suggestion_application_id ON mira_class_ai_suggestion (application_id, generated_at DESC);
CREATE INDEX idx_mira_class_ai_suggestion_status ON mira_class_ai_suggestion (status);

CREATE TABLE mira_class_module_outline (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES mira_class(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre dans le programme (1, 2, 3...)
    title VARCHAR(200) NOT NULL,
    estimated_duration_hours NUMERIC(4, 1) NOT NULL CHECK (estimated_duration_hours > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (class_id, position)
);

CREATE INDEX idx_mira_class_module_outline_class_id ON mira_class_module_outline (class_id, position);

CREATE TABLE skill_demand_aggregate (
    skill_id UUID NOT NULL PRIMARY KEY,                    -- ref skill.id

    students_wanting_count INTEGER NOT NULL DEFAULT 0 CHECK (students_wanting_count >= 0),
    mentors_offering_count INTEGER NOT NULL DEFAULT 0 CHECK (mentors_offering_count >= 0),
    active_classes_count INTEGER NOT NULL DEFAULT 0,        -- nombre de mira_class published avec cette skill
    gap_score NUMERIC(6, 2) NOT NULL DEFAULT 0,             -- computed : students_wanting / max(mentors_offering, 1)

    period_label VARCHAR(32) NOT NULL DEFAULT 'current_snapshot',
        -- en V1 prod : 'week_2026-19', 'month_2026-05', etc.

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_demand_aggregate_gap ON skill_demand_aggregate (gap_score DESC);
CREATE INDEX idx_skill_demand_aggregate_demand ON skill_demand_aggregate (students_wanting_count DESC);
"""


def _split_statements(sql: str) -> list[str]:
    # asyncpg refuse les multi-statements en un prepare. On retire les
    # commentaires `--` puis on split sur `;`.
    import re
    sql = re.sub(r'--[^\n]*', '', sql)  # strip line comments
    return [p.strip() for p in sql.split(';') if p.strip()]


def upgrade() -> None:
    for stmt in _split_statements(SCHEMA_SQL):
        op.execute(stmt)


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS skill_demand_aggregate CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_outline CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_ai_suggestion CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_rating_breakdown CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_profile_skill CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_cv_import CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_application_skill CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_application CASCADE;')
    op.execute('DROP TABLE IF EXISTS skill CASCADE;')
