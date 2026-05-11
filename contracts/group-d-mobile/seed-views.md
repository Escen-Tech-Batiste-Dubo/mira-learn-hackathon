# Seed views — Group D

**Statut** : tables **read-only seedées** dans la Supabase de Group D
**Reprenabilité post-hackathon** : ces tables disparaissent (consommation via HMAC cross-services + WebSocket events-api)

## Description fonctionnelle

Group D (mobile) consomme massivement des données de tous les autres groupes. Comme l'app Flutter est read-mostly côté backend, les données sont **seedées en read-only** dans la Supabase de Group D, structurées pour les requêtes mobile rapides.

---

## Table : `student_class_view`

**Schéma** :
```sql
CREATE TABLE student_class_view (
    -- Identité (read seed depuis Group B)
    enrolment_id UUID NOT NULL PRIMARY KEY,                -- = mira_class_enrolment.id
    user_id UUID NOT NULL,                                 -- l'étudiant inscrit
    class_id UUID NOT NULL,
    session_id UUID NOT NULL,
    class_title VARCHAR(200) NOT NULL,
    class_description TEXT NOT NULL DEFAULT '',

    -- Mentor (denorm)
    mentor_user_id UUID NOT NULL,
    mentor_display_name VARCHAR(120) NOT NULL,
    mentor_avatar_url VARCHAR(500) NULL,

    -- Session info
    session_type VARCHAR(16) NOT NULL,
    location_city VARCHAR(120) NULL,
    location_country VARCHAR(120) NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Statut étudiant
    enrolment_status VARCHAR(32) NOT NULL,                 -- 'accepted', 'completed', etc.
    completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,       -- progression dans la class
    next_module_at TIMESTAMP WITH TIME ZONE NULL,
    next_module_title VARCHAR(200) NULL,

    -- Modules avec materials (JSONB array pour query unique)
    modules_with_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [
        --   {
        --     "module_id": "...",
        --     "title": "...",
        --     "description": "...",
        --     "position": 1,
        --     "scheduled_at": "...",
        --     "status": "scheduled|in_progress|completed",
        --     "materials": [
        --       {"id": "...", "phase": "before", "label": "...", "url": "...", "type": "file|link"},
        --       ...
        --     ],
        --     "quiz_id": "..." (nullable)
        --   },
        --   ...
        -- ]

    -- Cohort (denorm autres apprenants inscrits)
    cohort_members JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [{"user_id": "...", "display_name": "...", "avatar_url": "..."}, ...]

    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_class_view_user_id ON student_class_view (user_id, starts_at);
CREATE INDEX idx_student_class_view_class_id ON student_class_view (class_id);
```

**Source** : 2-3 inscriptions seedées pour les nomads test (issus de `mira_class_enrolment` Group B + denormalisation des modules + materials).

**Routes API consommatrices** (Group D) :
- `GET /v1/students/me/classes` (mes inscriptions)
- `GET /v1/students/me/classes/{enrolment_id}` (détail)
- `GET /v1/students/me/classes/{enrolment_id}/modules/{module_id}` (détail module avec materials débloqués)

**Reprenabilité** : disparaît. Remplacée par HMAC vers `classes-api` + cache mobile local (Drift).

---

## Tables quiz read-only (compat schéma Group B)

```sql
CREATE TABLE mira_class_module_quiz (
    -- Schéma identique à Group B (cf contracts/group-b-class/mira_class_module_quiz.md)
    id UUID NOT NULL PRIMARY KEY,
    module_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    pass_threshold_pct INTEGER NOT NULL,
    time_limit_seconds INTEGER NULL,
    max_attempts INTEGER NOT NULL,
    shuffle_questions BOOLEAN NOT NULL,
    shuffle_options BOOLEAN NOT NULL,
    show_explanations_after BOOLEAN NOT NULL,
    status VARCHAR(16) NOT NULL,
    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE mira_class_module_quiz_question (
    id UUID NOT NULL PRIMARY KEY,
    quiz_id UUID NOT NULL,
    position INTEGER NOT NULL,
    type VARCHAR(16) NOT NULL,
    prompt TEXT NOT NULL,
    points INTEGER NOT NULL,
    explanation TEXT NULL,
    image_url VARCHAR(500) NULL,
    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE mira_class_module_quiz_option (
    id UUID NOT NULL PRIMARY KEY,
    question_id UUID NOT NULL,
    position INTEGER NOT NULL,
    label TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    explanation TEXT NULL,
    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Source** : Quiz seedés depuis Group B (3-5 quiz avec 10-15 questions au total).

**Routes API consommatrices** (Group D) :
- `GET /v1/students/me/quizzes/{quiz_id}` (lire QCM — sans `is_correct` côté Public)
- (Voir routes `student_quiz_attempt` pour le scoring qui utilise `is_correct` côté backend)

**Reprenabilité** : disparaît. Le backend Group D consomme via HMAC `forms-api` (post-hackathon).

---

## Table : `global_active_session_view`

```sql
CREATE TABLE global_active_session_view (
    id UUID NOT NULL PRIMARY KEY,                          -- = mira_class_session.id
    class_id UUID NOT NULL,
    mentor_user_id UUID NOT NULL,
    mentor_display_name VARCHAR(120) NOT NULL,

    class_title VARCHAR(200) NOT NULL,
    primary_skill_category VARCHAR(32) NOT NULL,           -- 'business', 'design', etc.
    top_skills JSONB NOT NULL DEFAULT '[]'::jsonb,         -- ["Pitch investor", "Lean Canvas"]

    format VARCHAR(16) NOT NULL CHECK (format IN ('physical', 'virtual', 'hybrid')),
    location_city VARCHAR(120) NULL,
    location_country VARCHAR(120) NULL,
    location_lat NUMERIC(10, 7) NULL,
    location_lng NUMERIC(10, 7) NULL,

    status VARCHAR(32) NOT NULL CHECK (status IN ('in_progress', 'starting_soon')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,

    current_enrolment_count INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL,

    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_global_active_session_status ON global_active_session_view (status, starts_at);
CREATE INDEX idx_global_active_session_location ON global_active_session_view (location_country, location_city);
CREATE INDEX idx_global_active_session_category ON global_active_session_view (primary_skill_category);
```

**Source** : 15-20 sessions actives réparties globalement (Barcelone, Lisbonne, Bali, Mexico City, Cape Town, Bangkok, Buenos Aires, Tbilisi, Medellín, Chiang Mai, Marrakech, Tulum), mix `in_progress` et `starting_soon`.

**Routes API consommatrices** :
- `GET /v1/community/map/sessions` (carte mondiale Group D)

**Reprenabilité** : vue matérialisée dans nouveau service `stats-api` ou `events-api` extension. Refresh cron toutes les 5min.

---

## Tables trending

```sql
CREATE TABLE trending_skill_view (
    skill_id UUID NOT NULL,
    period VARCHAR(16) NOT NULL CHECK (period IN ('week', 'month')),
    enrolments_count INTEGER NOT NULL DEFAULT 0,
    validations_count INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),

    -- Denorm
    skill_name VARCHAR(120) NOT NULL,
    skill_category VARCHAR(32) NOT NULL,

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (skill_id, period)
);

CREATE TABLE trending_destination_view (
    location_city VARCHAR(120) NOT NULL,
    location_country VARCHAR(120) NOT NULL,
    location_lat NUMERIC(10, 7) NULL,
    location_lng NUMERIC(10, 7) NULL,
    active_sessions_count INTEGER NOT NULL DEFAULT 0,
    period VARCHAR(16) NOT NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (location_city, period)
);

CREATE TABLE featured_mentor_view (
    mentor_user_id UUID NOT NULL,
    period VARCHAR(16) NOT NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),

    -- Denorm
    display_name VARCHAR(120) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    headline VARCHAR(255) NOT NULL DEFAULT '',
    top_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    classes_given_count INTEGER NOT NULL,
    aggregate_rating NUMERIC(3, 2) NULL,

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (mentor_user_id, period)
);
```

**Sources** :
- `trending_skill_view` : 5-10 skills seedés trending (week + month)
- `trending_destination_view` : top 5 destinations
- `featured_mentor_view` : 3-5 mentors mis en avant

**Routes API consommatrices** :
- `GET /v1/community/trending/skills?period=week`
- `GET /v1/community/trending/destinations?period=month`
- `GET /v1/community/featured-mentors?period=month`

**Reprenabilité** : vues matérialisées dans nouveau `stats-api` ou extension `community-api`. Refresh cron nightly.

---

## Cohérence seeds inter-groupes

Comme pour Group C, les UUIDs (mentor_user_id, class_id, session_id, skill_id) doivent être **identiques** entre les Supabase des 4 groupes pour que les stories de démo soient cohérentes.

Le seed Louis génère un fichier `shared-seed-ids.json` consommé par tous les seeds.

## Reprenabilité globale

Toutes les tables seed disparaissent post-hackathon. Le mobile app Flutter (devenu `apps/mira_learn` dans le monorepo Hello Mira) consomme directement les services backbone via SDK Dart auto-généré + WebSocket events-api pour le temps-réel (feed live, notifs).

**Effort migration mobile** : ~4-5h Claude Code (remplacer requêtes Supabase par appels SDK Dio + WebSocket).
