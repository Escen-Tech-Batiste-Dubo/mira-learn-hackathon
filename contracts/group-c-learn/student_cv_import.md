# student_cv_import

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : migration vers `users-api.cv_import` ou consolidation avec `mentor_cv_import` dans un service `cv-parser-api` (à arbitrer)

## Description fonctionnelle

Trace les imports de CV par un étudiant pour préremplir son profil (`student_profile`). Schéma identique à `mentor_cv_import` (Group A) — même pattern. Le but : le nomad uploade son CV, l'IA extrait expériences + skills déjà acquises, le profil est prérempli.

## Schéma SQL

```sql
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
```

## Schéma Pydantic

Identique à `mentor_cv_import` (cf. `group-a-mentor/mentor_cv_import.md`) avec uniquement renommages :
- `application_id` → `profile_id`
- Schémas Pydantic adaptés (préfixe `StudentCVImport...`)

## Contraintes métier

Identiques à `mentor_cv_import`. À la validation (`status='validated'`) :
- Injection auto dans `student_profile.professional_journey` (concat experiences)
- Injection auto dans `student_skill` (insert skills validées avec `source='cv_import'`)

## Relations

- **Référence** : `profile_id` → `student_profile.id` (CASCADE)

## Routes API

```
POST   /v1/students/me/cv-imports                          — uploader CV
GET    /v1/students/me/cv-imports                          — list mes imports
GET    /v1/students/me/cv-imports/{id}                     — détail (polling)
PATCH  /v1/students/me/cv-imports/{id}/validate            — valider résultats
DELETE /v1/students/me/cv-imports/{id}                     — soft delete

# Internal
POST   /internal/cv-imports/{id}/extract                   — job worker
```

## Seed attendu

2-3 imports CV seedés au status `validated` pour les nomads seedés (pour démontrer profil prérempli).

## Reprenabilité

**Consolidation post-hackathon** : `mentor_cv_import` et `student_cv_import` ont une logique très similaire. Peuvent être consolidés dans un service `cv-parser-api` ou dans `analyzers-api` (qui fait déjà du parsing IA).

**Effort** : ~2h Claude Code (consolidation avec mentor_cv_import).
