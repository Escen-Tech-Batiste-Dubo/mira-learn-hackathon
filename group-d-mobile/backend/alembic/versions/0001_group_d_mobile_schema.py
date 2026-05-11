"""0001 — group-d-mobile schema (auto-généré depuis contracts/)

Migration produite par hackathon/seeds/build_schema_migrations.py.
NE PAS éditer à la main : régénérer le script et re-runner.

Inclut :
  - shared/ (skill)
  - contracts/group-d-mobile/ (tables propres au groupe)
  - tables cross-groupe référencées (sans FK enforced)

Revision ID: 0001d
Revises:
Create Date: 2026-05-11
"""
from alembic import op

revision = "0001d"
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

CREATE TABLE community_activity_feed (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,

    event_type VARCHAR(64) NOT NULL CHECK (event_type IN (
        'skill_validated',
        'class_started',
        'enrolment_made',
        'class_published_soon',
        'mentor_validated',
        'cohort_completed',
        'milestone_reached'
    )),

    -- Affichage UI (pré-formaté + anonymisé)
    display_text TEXT NOT NULL,
        -- ex : "Une nomade vient de valider la skill 'Lean Canvas'"
        -- ex : "3 nouvelles inscriptions sur 'Pitch investisseur' à Lisbonne"
        -- ex : "Une class démarre demain à Bali"
    display_icon VARCHAR(32) NULL,                         -- ex 'graduation-cap', 'rocket'

    -- Context (JSON pour debug + future filtering, pas d'identifiants user directs)
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma examples :
        --   skill_validated : { "skill_name": "Lean Canvas", "skill_category": "business" }
        --   class_started   : { "class_title": "Pitch investor", "city": "Bali", "country": "Indonesia" }
        --   enrolment_made  : { "class_title": "...", "city": "Lisbon", "count": 3 }

    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,         -- date "fictive" affichée
    expires_at TIMESTAMP WITH TIME ZONE NULL,              -- après cette date, ne plus afficher
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_activity_feed_occurred ON community_activity_feed (occurred_at DESC)
    WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_community_activity_feed_event_type ON community_activity_feed (event_type, occurred_at DESC);

CREATE TABLE student_note (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,                                 -- ref Supabase auth.users.id
    class_id UUID NOT NULL,                                -- denorm pour filtrage
    session_id UUID NULL,                                  -- optionnel : session spécifique
    module_id UUID NULL,                                   -- optionnel : module spécifique

    content TEXT NOT NULL DEFAULT '',                      -- markdown
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : ["concept-lean-canvas", "important", "to-review"]
    replay_timecode_seconds INTEGER NULL,                  -- si lié à un moment précis de replay

    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    color VARCHAR(16) NULL,                                -- couleur tag visuel (yellow, green, red, blue)

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_student_note_user_class ON student_note (user_id, class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_note_module_id ON student_note (module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_student_note_tags ON student_note USING gin (tags);
CREATE INDEX idx_student_note_created ON student_note (user_id, created_at DESC);

CREATE TABLE student_note_organization (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    class_id UUID NOT NULL,

    -- Scope organisation
    scope_module_id UUID NULL,                             -- si organisation portée par module spécifique
    note_ids_organized JSONB NOT NULL DEFAULT '[]'::jsonb, -- liste student_note.id couverts

    -- Output IA
    summary TEXT NOT NULL,                                 -- résumé général markdown
    concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [
        --   {
        --     "concept_name": "Lean Canvas",
        --     "description": "...",
        --     "related_note_ids": ["uuid1", "uuid2"],
        --     "key_points": ["...", "..."]
        --   },
        --   ...
        -- ]
    key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : ["takeaway 1", "takeaway 2", ...]

    generated_by_llm BOOLEAN NOT NULL DEFAULT TRUE,
    llm_model_used VARCHAR(64) NOT NULL,
    llm_tokens_consumed INTEGER NULL,
    generation_latency_ms INTEGER NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_note_organization_user_class ON student_note_organization (user_id, class_id, created_at DESC);

CREATE TABLE student_quiz_answer (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES student_quiz_attempt(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,                             -- ref mira_class_module_quiz_question.id

    selected_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- liste UUID
    is_correct BOOLEAN NULL,                                -- NULL avant submit, computed après
    points_earned INTEGER NULL,                             -- NULL avant submit

    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_student_quiz_answer_attempt_id ON student_quiz_answer (attempt_id);

CREATE TABLE student_quiz_attempt (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    quiz_id UUID NOT NULL,                                 -- ref mira_class_module_quiz.id (read seed)
    module_id UUID NOT NULL,                               -- denorm pour query directe
    class_id UUID NOT NULL,                                -- denorm

    -- Numérotation
    attempt_number INTEGER NOT NULL,                       -- 1, 2, 3... (cf. quiz.max_attempts)

    -- Lifecycle
    status VARCHAR(16) NOT NULL DEFAULT 'started' CHECK (status IN (
        'started', 'submitted', 'expired', 'abandoned'
    )),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE NULL,
    expired_at TIMESTAMP WITH TIME ZONE NULL,              -- si time_limit dépassé
    time_spent_seconds INTEGER NULL,

    -- Scoring
    score INTEGER NULL,                                    -- points obtenus
    max_score INTEGER NOT NULL,                            -- total points possibles (snapshot moment de la tentative)
    score_pct NUMERIC(5, 2) NULL CHECK (score_pct IS NULL OR score_pct BETWEEN 0 AND 100),
    passed BOOLEAN NULL,                                   -- score_pct >= quiz.pass_threshold_pct ; NULL avant submit

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, quiz_id, attempt_number)
);

CREATE INDEX idx_student_quiz_attempt_user_quiz ON student_quiz_attempt (user_id, quiz_id);
CREATE INDEX idx_student_quiz_attempt_class ON student_quiz_attempt (user_id, class_id);
CREATE INDEX idx_student_quiz_attempt_status ON student_quiz_attempt (status);
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
    op.execute('DROP TABLE IF EXISTS student_quiz_attempt CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_quiz_answer CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_note_organization CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_note CASCADE;')
    op.execute('DROP TABLE IF EXISTS community_activity_feed CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_skill CASCADE;')
    op.execute('DROP TABLE IF EXISTS student_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz_option CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz_question CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module_quiz CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class_module CASCADE;')
    op.execute('DROP TABLE IF EXISTS mira_class CASCADE;')
    op.execute('DROP TABLE IF EXISTS mentor_profile CASCADE;')
    op.execute('DROP TABLE IF EXISTS skill CASCADE;')
