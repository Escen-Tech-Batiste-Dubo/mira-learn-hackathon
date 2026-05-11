"""0001 — group-c-learn schema (auto-généré depuis contracts/)

Migration produite par hackathon/seeds/build_schema_migrations.py.
NE PAS éditer à la main : régénérer le script et re-runner.

Inclut :
  - shared/ (skill)
  - contracts/group-c-learn/ (tables propres au groupe)
  - tables cross-groupe référencées (sans FK enforced)

Revision ID: 0001c
Revises:
Create Date: 2026-05-11
"""
from alembic import op

revision = "0001c"
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

CREATE TABLE skill_relation (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_skill_id UUID NOT NULL,                           -- ref skill.id
    to_skill_id UUID NOT NULL,                             -- ref skill.id

    relation_type VARCHAR(32) NOT NULL CHECK (relation_type IN (
        'prerequisite_of', 'related_to', 'builds_on'
    )),

    strength NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
        -- force de la relation (1 = très fort, 0.5 = modéré)

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CHECK (from_skill_id != to_skill_id),
    UNIQUE (from_skill_id, to_skill_id, relation_type)
);

CREATE INDEX idx_skill_relation_from ON skill_relation (from_skill_id, relation_type);
CREATE INDEX idx_skill_relation_to ON skill_relation (to_skill_id, relation_type);

CREATE TABLE student_cv_import (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,

    source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('pdf', 'linkedin_url', 'manual_paste')),
    file_url VARCHAR(500) NULL,
    source_url VARCHAR(500) NULL,
    raw_text TEXT NULL,

    status VARCHAR(32) NOT NULL DEFAULT 'uploaded' CHECK (status IN (
        'uploaded', 'extracting', 'extracted', 'validated', 'failed'
    )),
    error_message TEXT NULL,

    extracted_experiences_raw JSONB NULL,
        -- même schéma que mentor_cv_import.extracted_experiences_raw
    extracted_skills_raw JSONB NULL,
        -- Schéma : [{"skill_slug": "...", "level": "intermediate", "confidence": 0.7, "evidence": "..."}, ...]

    validated_experiences JSONB NULL,
    validated_skills JSONB NULL,

    extracted_at TIMESTAMP WITH TIME ZONE NULL,
    validated_at TIMESTAMP WITH TIME ZONE NULL,
    llm_model_used VARCHAR(64) NULL,
    llm_tokens_consumed INTEGER NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_student_cv_import_profile_id ON student_cv_import (profile_id);
CREATE INDEX idx_student_cv_import_status ON student_cv_import (status) WHERE deleted_at IS NULL;

CREATE TABLE student_enrolment_intent (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,                              -- ref mira_class_session.id (read seed)
    class_id UUID NOT NULL,                                -- ref mira_class.id (denorm pour filtrage)

    -- Réponses au form de validation participation
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma libre : { "motivation": "...", "experience_in_topic": "...", "specific_questions": "..." }

    -- Status local (avant transmission à Group B)
    status VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'transmitted_to_mentor'
    )),

    -- Source du parcours (si arrive depuis student_learning_path)
    source_learning_path_id UUID NULL,
    source_learning_path_step_id UUID NULL,

    submitted_at TIMESTAMP WITH TIME ZONE NULL,
    transmitted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (profile_id, session_id) WHERE status != 'draft'
);

CREATE INDEX idx_student_enrolment_intent_profile_id ON student_enrolment_intent (profile_id, status);
CREATE INDEX idx_student_enrolment_intent_session_id ON student_enrolment_intent (session_id);

CREATE TABLE student_learning_path (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL DEFAULT '',                 -- "Mon parcours growth marketing"
    target_skills JSONB NOT NULL DEFAULT '[]'::jsonb,      -- snapshot des skills cibles au moment de la génération
    target_horizon VARCHAR(16) NOT NULL CHECK (target_horizon IN (
        '3_months', '6_months', '1_year', '2_years'
    )),

    -- Output IA
    total_steps INTEGER NOT NULL DEFAULT 0,
    estimated_duration_hours INTEGER NOT NULL DEFAULT 0,
    completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,       -- 0-100, calculé depuis student_learning_path_step

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'completed', 'abandoned'
    )),

    -- IA tracking
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    llm_model_used VARCHAR(64) NOT NULL,
    llm_tokens_consumed INTEGER NULL,

    started_at TIMESTAMP WITH TIME ZONE NULL,              -- première étape validée
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    abandoned_at TIMESTAMP WITH TIME ZONE NULL,
    abandoned_reason VARCHAR(64) NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_student_learning_path_profile_id ON student_learning_path (profile_id, status)
    WHERE deleted_at IS NULL;

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
    op.execute('DROP TABLE IF EXISTS student_skill CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_path_regeneration_log CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_learning_path_step CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_learning_path CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_enrolment_intent CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_cv_import CASCADE;')
    op.execute('DROP TABLE IF EXISTS skill_relation CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS skill CASCADE;')
