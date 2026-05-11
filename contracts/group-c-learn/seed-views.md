# Seed views — Group C

**Statut** : tables **read-only seedées** dans la Supabase de Group C (pas owned, données figées par seed pré-prep)
**Reprenabilité post-hackathon** : ces tables disparaissent (consommation via HMAC cross-services backbone)

## Description fonctionnelle

Group C consomme des données provenant de Group A (mentors validés) et Group B (classes published + sessions). Comme les groupes ne partagent pas leur Supabase pendant le hackathon, ces données sont **seedées en read-only** dans la DB de Group C avec un schéma simplifié orienté lecture.

En V1 prod, ces vues n'existent pas : Group C (devenu `users-api` + frontend) consomme via HMAC vers `mentors-api` et `classes-api`.

---

## Table : `mentor_directory`

**Schéma** :
```sql
CREATE TABLE mentor_directory (
    user_id UUID NOT NULL PRIMARY KEY,                     -- ref Supabase auth.users.id (cohérent avec Group A)
    slug VARCHAR(120) NOT NULL UNIQUE,

    display_name VARCHAR(120) NOT NULL,
    headline VARCHAR(255) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar_url VARCHAR(500) NULL,

    -- Skills primary (top 3 affichés en vignette)
    primary_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        -- Schéma : [{"skill_id": "...", "skill_name": "Pitch investor", "level": "expert"}, ...]
    all_skills_count INTEGER NOT NULL DEFAULT 0,

    -- Stats (snapshot)
    aggregate_rating NUMERIC(3, 2) NULL,
    rating_count INTEGER NOT NULL DEFAULT 0,
    classes_given_count INTEGER NOT NULL DEFAULT 0,

    -- Localisation
    based_in_city VARCHAR(120) NULL,
    based_in_country VARCHAR(120) NULL,

    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentor_directory_rating ON mentor_directory (aggregate_rating DESC NULLS LAST);
CREATE INDEX idx_mentor_directory_classes_count ON mentor_directory (classes_given_count DESC);
CREATE INDEX idx_mentor_directory_primary_skills ON mentor_directory USING gin (primary_skills);
```

**Source seedée** : 15-20 mentors copiés depuis Group A `mentor_profile` + denormalisation `mentor_profile_skill` (top 3 primary).

**Routes API consommatrices** :
- `GET /v1/mentors/catalog` (Group C → catalogue mentors)
- `GET /v1/mentors/{slug}` (Group C → fiche mentor publique)

**Reprenabilité** : la table disparaît. Remplacée par appel HMAC `GET /internal/mentors-api/mentors/catalog` post-hackathon.

---

## Table : `class_directory`

**Schéma** :
```sql
CREATE TABLE class_directory (
    id UUID NOT NULL PRIMARY KEY,                          -- = mira_class.id de Group B
    mentor_user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    skills_taught JSONB NOT NULL DEFAULT '[]'::jsonb,      -- liste skill_id
    total_hours INTEGER NOT NULL DEFAULT 0,
    format_envisaged VARCHAR(16) NOT NULL,

    -- Stats
    aggregate_rating NUMERIC(3, 2) NULL,
    rating_count INTEGER NOT NULL DEFAULT 0,
    sessions_count INTEGER NOT NULL DEFAULT 0,
    upcoming_sessions_count INTEGER NOT NULL DEFAULT 0,

    -- Image
    cover_url VARCHAR(500) NULL,

    -- Snapshot mentor (pour éviter JOIN dans catalogue)
    mentor_display_name VARCHAR(120) NOT NULL,
    mentor_slug VARCHAR(120) NOT NULL,
    mentor_avatar_url VARCHAR(500) NULL,

    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_directory_mentor_user_id ON class_directory (mentor_user_id);
CREATE INDEX idx_class_directory_skills ON class_directory USING gin (skills_taught);
CREATE INDEX idx_class_directory_rating ON class_directory (aggregate_rating DESC NULLS LAST);
CREATE INDEX idx_class_directory_published_at ON class_directory (published_at DESC);
```

**Source seedée** : ~15 classes `published` de Group B avec leurs sessions agrégées.

**Routes API consommatrices** :
- `GET /v1/classes/catalog` (Group C → catalogue classes)
- `GET /v1/classes/{id}` (Group C → fiche class)
- `GET /v1/classes?skill_id=...` (filtre par skill — utilisé par parcours apprenant)

**Reprenabilité** : disparaît. Remplacée par HMAC vers `classes-api`.

---

## Table : `session_directory`

**Schéma** :
```sql
CREATE TABLE session_directory (
    id UUID NOT NULL PRIMARY KEY,                          -- = mira_class_session.id de Group B
    class_id UUID NOT NULL,                                -- = mira_class.id
    class_title VARCHAR(200) NOT NULL,                     -- denorm pour affichage rapide
    mentor_user_id UUID NOT NULL,
    mentor_display_name VARCHAR(120) NOT NULL,

    type VARCHAR(16) NOT NULL,
    location_city VARCHAR(120) NULL,
    location_country VARCHAR(120) NULL,
    location_lat NUMERIC(10, 7) NULL,
    location_lng NUMERIC(10, 7) NULL,

    capacity INTEGER NOT NULL,
    enrolment_count INTEGER NOT NULL DEFAULT 0,
    waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    waitlist_count INTEGER NOT NULL DEFAULT 0,

    price_cents BIGINT NOT NULL DEFAULT 0,

    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    enrolment_deadline TIMESTAMP WITH TIME ZONE NULL,

    status VARCHAR(32) NOT NULL,                           -- 'open_enrolment', 'full', etc.
    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,

    seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_directory_class_id ON session_directory (class_id);
CREATE INDEX idx_session_directory_status_starts ON session_directory (status, starts_at);
CREATE INDEX idx_session_directory_location ON session_directory (location_city);
```

**Source seedée** : ~15-20 sessions de Group B, mix statuts `open_enrolment` (pour démo inscription) et `in_progress` / `completed`.

**Routes API consommatrices** :
- `GET /v1/sessions/upcoming` (catalogue sessions ouvertes)
- `GET /v1/classes/{id}/sessions` (sessions d'une class)

**Reprenabilité** : disparaît. Remplacée par HMAC vers `classes-api`.

---

## Seed cohérence

**Important** : les UUIDs des entités seedées dans Group C doivent matcher ceux de Group A et Group B (mentor IDs, class IDs, skill IDs identiques entre Supabase projets). Le script de seed Louis (en pré-prep) génère un fichier `shared-seed-ids.json` consommé par tous les seeds pour garantir cette cohérence.

Sans ça, le storytelling jury ne marche pas (ex : "Antoine validé dans Group A" doit être le même Antoine que dans `mentor_directory` de Group C).

## Reprenabilité globale

Toutes ces tables de seed disparaissent post-hackathon. Le frontend Group C (devenu `mira-learn-web` fronts catalogue) consomme directement les services backbone via SDK auto-généré :
- `mentors-api` → annuaire mentors
- `classes-api` → catalogue classes + sessions
- `skills-api` → recherche skills

**Effort migration** : ~3-4h Claude Code (remplacer requêtes Supabase locales par appels SDK HMAC ou public).
