# student_note

**Possédé par** : Group D (write)
**Reprenabilité post-hackathon** : nouveau service `notes-api` (à arbitrer V1.5) OU extension `users-api` selon décision finale

## Description fonctionnelle

Notes personnelles d'un étudiant pendant qu'il suit une class. Markdown, taggées, optionnellement attachées à un module spécifique avec timecode si replay.

Les notes peuvent être organisées par l'IA via `student_note_organization` (regroupement par concept, résumé, extraction points clés).

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

NoteColor = Literal["yellow", "green", "red", "blue", "purple"]


class StudentNoteBase(BaseModel):
    class_id: str
    session_id: Optional[str] = None
    module_id: Optional[str] = None
    content: str = Field(default="", max_length=50000)
    tags: list[str] = []
    replay_timecode_seconds: Optional[int] = Field(None, ge=0)
    is_favorite: bool = False
    color: Optional[NoteColor] = None


class StudentNoteCreate(StudentNoteBase):
    pass


class StudentNoteUpdate(BaseModel):
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    replay_timecode_seconds: Optional[int] = Field(None, ge=0)
    is_favorite: Optional[bool] = None
    color: Optional[NoteColor] = None


class StudentNoteRead(StudentNoteBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- Une note **doit** avoir un `class_id` mais `session_id`/`module_id` sont optionnels
- `content` peut être long (50 000 chars max) — markdown
- `tags` libres en string (pas de référentiel imposé)
- Si `module_id` ou `session_id` set, l'étudiant doit être inscrit à cette class (validation service)
- Soft delete pour restauration

## Relations

- **Référence** :
  - `user_id` → Supabase `auth.users.id`
  - `class_id` → `mira_class.id` (référence logique cross-groupe — read seed)
  - `session_id` → `mira_class_session.id` (référence logique)
  - `module_id` → `mira_class_module.id` (référence logique)

## Routes API

```
POST   /v1/students/me/notes                              — créer
GET    /v1/students/me/notes                              — list (filtres : class_id, module_id, tags, is_favorite)
GET    /v1/students/me/notes/{id}                         — détail
PATCH  /v1/students/me/notes/{id}                         — update
DELETE /v1/students/me/notes/{id}                         — soft delete
POST   /v1/students/me/notes/{id}/restore                 — restaurer
```

## Seed attendu

Pour les 2 nomads inscrits seedés : ~15-20 notes chacun réparties sur leurs classes, avec mix de tags + 2-3 favoris + 1-2 timecodes replay.

## Reprenabilité

**Mapping** : nouveau service `notes-api` (transverse — utile aussi hors Mira Learn pour carnet voyage Mira Trip) OU module dans `users-api`. À trancher V1.5.

**Effort** : ~3h Claude Code.
