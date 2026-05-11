"""0001 — group-b-class schema (auto-généré depuis contracts/)

Migration produite par hackathon/seeds/build_schema_migrations.py.
NE PAS éditer à la main : régénérer le script et re-runner.

Inclut :
  - shared/ (skill)
  - contracts/group-b-class/ (tables propres au groupe)
  - tables cross-groupe référencées (sans FK enforced)

Revision ID: 0001b
Revises:
Create Date: 2026-05-11
"""
from alembic import op

revision = "0001b"
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

CREATE TABLE mira_class_enrolment (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mira_class_session(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,                                 -- ref Supabase auth.users.id

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'applied' CHECK (status IN (
        'applied', 'waitlist', 'accepted', 'rejected', 'cancelled', 'completed'
    )),
    waitlist_position INTEGER NULL CHECK (waitlist_position IS NULL OR waitlist_position >= 1),

    -- Données saisies par l'apprenant lors de la postulation
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma libre : réponses au form de validation participation, motivations, etc.

    -- Décision mentor
    decision_at TIMESTAMP WITH TIME ZONE NULL,
    decision_by_mentor_id UUID NULL,                       -- ref Supabase auth.users.id (mentor)
    decision_reason TEXT NULL,                             -- obligatoire si status='rejected'

    -- Annulation apprenant
    cancellation_at TIMESTAMP WITH TIME ZONE NULL,
    cancellation_reason TEXT NULL,

    -- Complétion
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    completion_score_pct NUMERIC(5, 2) NULL,               -- moyenne scores QCM si applicable

    -- Audit
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (session_id, user_id) WHERE status NOT IN ('cancelled', 'rejected')
        -- un user peut se ré-inscrire après cancel/reject
);

CREATE INDEX idx_mira_class_enrolment_session_id ON mira_class_enrolment (session_id, status);
CREATE INDEX idx_mira_class_enrolment_user_id ON mira_class_enrolment (user_id, status);
CREATE INDEX idx_mira_class_enrolment_waitlist ON mira_class_enrolment (session_id, waitlist_position)
    WHERE status = 'waitlist';

CREATE TABLE mira_class_module (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL,                                -- ref mira_class.id (seed read côté Group B)
    position INTEGER NOT NULL,                             -- ordre dans la class
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',                  -- markdown, contenu pédagogique du module
    duration_hours NUMERIC(4, 1) NOT NULL CHECK (duration_hours > 0),
    type VARCHAR(32) NOT NULL DEFAULT 'theory' CHECK (type IN (
        'theory', 'practice', 'exercise', 'discussion', 'workshop'
    )),

    -- Liens IA
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,           -- TRUE si suggéré par l'IA
    source_outline_id UUID NULL,                           -- ref mira_class_module_outline.id si upgrade depuis outline

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    UNIQUE (class_id, position) DEFERRABLE INITIALLY DEFERRED
        -- DEFERRABLE pour permettre les reorder par swap
);

CREATE INDEX idx_mira_class_module_class_id ON mira_class_module (class_id, position) WHERE deleted_at IS NULL;

CREATE TABLE mira_class_module_quiz (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID NOT NULL,                               -- ref mira_class_module.id
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    -- Paramètres
    pass_threshold_pct INTEGER NOT NULL DEFAULT 70 CHECK (pass_threshold_pct BETWEEN 0 AND 100),
    time_limit_seconds INTEGER NULL CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 20),
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
    show_explanations_after BOOLEAN NOT NULL DEFAULT TRUE, -- afficher explanation après réponse

    -- State machine
    status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'published', 'archived'
    )),

    -- IA tracking
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generation_prompt_hash VARCHAR(64) NULL,            -- pour debug si génération buggée

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    UNIQUE (module_id) WHERE deleted_at IS NULL              -- 1 quiz par module max
);

CREATE INDEX idx_mira_class_module_quiz_module_id ON mira_class_module_quiz (module_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_module_quiz_status ON mira_class_module_quiz (status) WHERE deleted_at IS NULL;

CREATE TABLE mira_class_module_quiz_option (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES mira_class_module_quiz_question(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre d'affichage
    label TEXT NOT NULL,                                   -- texte de l'option
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT NULL,                                 -- explication spécifique à cette option (optionnel)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (question_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_quiz_option_question_id ON mira_class_module_quiz_option (question_id, position);

CREATE TABLE mira_class_module_quiz_question (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES mira_class_module_quiz(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,                             -- ordre dans le quiz
    type VARCHAR(16) NOT NULL CHECK (type IN ('single_choice', 'multi_choice')),
    prompt TEXT NOT NULL,                                  -- énoncé de la question (markdown)
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 1),
    explanation TEXT NULL,                                 -- affichée après réponse si quiz.show_explanations_after=TRUE
    image_url VARCHAR(500) NULL,                           -- image optionnelle accompagnant la question
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (quiz_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_quiz_question_quiz_id ON mira_class_module_quiz_question (quiz_id, position);

CREATE TABLE mira_class_module_skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES mira_class_module(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,                                -- ref skill.id

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,             -- skill principale du module (1 par module recommandé)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (module_id, skill_id)
);

CREATE INDEX idx_mira_class_module_skill_module_id ON mira_class_module_skill (module_id);
CREATE INDEX idx_mira_class_module_skill_skill_id ON mira_class_module_skill (skill_id);

CREATE TABLE mira_class_session (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL,                                -- ref mira_class.id (seed read)

    -- Type + localisation
    type VARCHAR(16) NOT NULL CHECK (type IN ('physical', 'virtual', 'hybrid')),
    location_address VARCHAR(500) NULL,                    -- pour physical/hybrid
    location_city VARCHAR(120) NULL,
    location_country VARCHAR(120) NULL,
    location_lat NUMERIC(10, 7) NULL,                      -- pour carte mondiale
    location_lng NUMERIC(10, 7) NULL,
    online_meeting_provider VARCHAR(32) NULL CHECK (online_meeting_provider IN ('zoom', 'meet', 'livekit', 'other')),
    online_meeting_default_url VARCHAR(500) NULL,          -- URL générique session (sinon par session_module)

    -- Capacité
    capacity INTEGER NOT NULL DEFAULT 10 CHECK (capacity >= 1 AND capacity <= 50),
    waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    waitlist_max_size INTEGER NOT NULL DEFAULT 20 CHECK (waitlist_max_size >= 0),

    -- Pricing (mock hackathon)
    price_cents BIGINT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'planned' CHECK (status IN (
        'planned', 'open_enrolment', 'full', 'in_progress', 'completed', 'cancelled'
    )),
    cancellation_reason TEXT NULL,

    -- Dates session globale
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    enrolment_deadline TIMESTAMP WITH TIME ZONE NULL,      -- deadline d'inscription (default starts_at -1j)

    -- Promotion
    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,            -- visibilité boostée au catalogue
    promoted_until TIMESTAMP WITH TIME ZONE NULL,

    -- Compteurs (dénormalisés)
    enrolment_count INTEGER NOT NULL DEFAULT 0 CHECK (enrolment_count >= 0),
    waitlist_count INTEGER NOT NULL DEFAULT 0 CHECK (waitlist_count >= 0),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    CHECK (ends_at > starts_at),
    CHECK (
        (type = 'virtual' AND location_address IS NULL)
        OR (type IN ('physical', 'hybrid') AND location_address IS NOT NULL)
    )
);

CREATE INDEX idx_mira_class_session_class_id ON mira_class_session (class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_session_status_starts ON mira_class_session (status, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_session_location ON mira_class_session (location_city, location_country) WHERE deleted_at IS NULL;
CREATE INDEX idx_mira_class_session_promoted ON mira_class_session (is_promoted, starts_at) WHERE is_promoted = TRUE AND deleted_at IS NULL;

CREATE TABLE mira_class_session_module (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mira_class_session(id) ON DELETE CASCADE,
    module_id UUID NOT NULL,                               -- ref mira_class_module.id

    position INTEGER NOT NULL,                             -- ordre dans la session (peut différer de mira_class_module.position si le mentor réordonne)
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,        -- date+heure du module dans cette session
    duration_hours NUMERIC(4, 1) NOT NULL CHECK (duration_hours > 0),

    -- Override online url (sinon utilise online_meeting_default_url de la session)
    online_meeting_url VARCHAR(500) NULL,

    -- Status d'avancement
    status VARCHAR(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'skipped'
    )),
    started_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (session_id, module_id),
    UNIQUE (session_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_mira_class_session_module_session_id ON mira_class_session_module (session_id, position);
CREATE INDEX idx_mira_class_session_module_scheduled ON mira_class_session_module (scheduled_at);

CREATE TABLE mira_class_session_module_material (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_module_id UUID NOT NULL REFERENCES mira_class_session_module(id) ON DELETE CASCADE,

    phase VARCHAR(16) NOT NULL CHECK (phase IN ('before', 'during', 'after')),

    material_type VARCHAR(16) NOT NULL CHECK (material_type IN ('file', 'link')),
    material_url VARCHAR(500) NOT NULL,                    -- URL Supabase Storage si file, URL externe si link
    file_size_bytes BIGINT NULL,                           -- pour file uniquement
    file_mime_type VARCHAR(120) NULL,                      -- ex 'application/pdf', 'video/mp4'

    label VARCHAR(200) NOT NULL,                           -- titre visible apprenant
    description TEXT NOT NULL DEFAULT '',                  -- description courte optionnelle
    ordering INTEGER NOT NULL DEFAULT 0,                   -- ordre d'affichage
    required BOOLEAN NOT NULL DEFAULT FALSE,               -- marqué "lecture obligatoire" pour l'apprenant

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_session_module_material_session_module_id ON mira_class_session_module_material (session_module_id, phase, ordering)
    WHERE deleted_at IS NULL;
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
    op.execute('DROP TABLE IF EXISTS mira_class_session_module_material CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_session_module CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_session CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_skill CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz_question CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz_option CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_enrolment CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS skill CASCADE;')
