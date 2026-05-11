# student_note_organization

**Possédé par** : Group D (write)
**Reprenabilité post-hackathon** : ressource du futur `notes-api`

## Description fonctionnelle

Résultat d'une demande "Organise mes notes avec l'IA" lancée par un étudiant pendant qu'il suit une class. L'IA (OpenRouter) prend en input toutes ses `student_note` de la class, et produit :
- Un résumé synthétique des notes (markdown)
- Un regroupement par concept (avec liens vers les notes originales)
- Une extraction des points clés

Permet à l'étudiant de réviser efficacement avant un QCM ou en fin de class.

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class OrganizedConcept(BaseModel):
    concept_name: str
    description: str
    related_note_ids: list[str]
    key_points: list[str]


class StudentNoteOrganizationCreate(BaseModel):
    """Demande d'organisation : input class_id + optionnel module_id (sinon toutes les notes de la class)."""
    class_id: str
    scope_module_id: Optional[str] = None


class StudentNoteOrganizationRead(BaseModel):
    id: str
    user_id: str
    class_id: str
    scope_module_id: Optional[str]
    note_ids_organized: list[str]
    summary: str
    concepts: list[OrganizedConcept]
    key_takeaways: list[str]
    generated_by_llm: bool
    llm_model_used: str
    llm_tokens_consumed: Optional[int]
    generation_latency_ms: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Génération synchrone** côté API (max 30s) : appel `LLMClient.organize_notes(notes)`
- Si l'étudiant a 0 notes → erreur 422 "Pas de notes à organiser"
- Si l'étudiant a >50 notes → l'IA traite par batch (ou avertit que c'est partiel)
- **Append-only** : pas d'UPDATE, si l'étudiant veut re-organiser il crée une nouvelle entrée (audit)
- Rate-limit : max 5 organisations par jour par user (préserver budget OpenRouter)

## Relations

- **Référence** :
  - `user_id` → Supabase `auth.users.id`
  - `class_id` → `mira_class.id` (référence logique)
  - `scope_module_id` → `mira_class_module.id` (référence logique)
  - `note_ids_organized[]` → `student_note.id` (référence logique)

## Routes API

```
POST   /v1/students/me/note-organizations              — créer (déclenche IA, sync)
GET    /v1/students/me/note-organizations              — list mes organisations
GET    /v1/students/me/note-organizations/{id}         — détail
DELETE /v1/students/me/note-organizations/{id}         — supprimer (sans soft delete : hard delete OK)
```

## Seed attendu

Pour les 2 nomads inscrits seedés : 1-2 organisations seedées pour démontrer le rendu UI sans déclencher IA en démo.

## Reprenabilité

**Mapping** : ressource du futur `notes-api`. Logique IA migrée vers `bots-api` avec tool `organize_notes`.

**Effort** : ~2h Claude Code.
