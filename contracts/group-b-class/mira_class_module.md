# mira_class_module

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_module`

## Description fonctionnelle

Module pédagogique détaillé d'une `mira_class`. Group B enrichit les `mira_class_module_outline` (programme grossier de Group A) en modules complets avec type, description, matériel pédagogique, QCM.

Un module appartient à une class et a un ordre fixe. Il peut avoir 0+ fichiers de matériel pédagogique (`mira_class_session_module_material`, attachés au niveau session), 0-1 QCM (`mira_class_module_quiz`), et plusieurs skills associées.

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

ModuleType = Literal["theory", "practice", "exercise", "discussion", "workshop"]


class MiraClassModuleBase(BaseModel):
    position: int = Field(..., ge=1)
    title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=10000)
    duration_hours: Decimal = Field(..., gt=0)
    type: ModuleType = "theory"


class MiraClassModuleCreate(MiraClassModuleBase):
    ai_generated: bool = False
    source_outline_id: Optional[str] = None


class MiraClassModuleUpdate(BaseModel):
    position: Optional[int] = Field(None, ge=1)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=10000)
    duration_hours: Optional[Decimal] = Field(None, gt=0)
    type: Optional[ModuleType] = None


class MiraClassModuleReorder(BaseModel):
    """Réorganisation des modules d'une class."""
    module_ids_in_order: list[str]                          # liste d'IDs dans le nouvel ordre


class MiraClassModuleRead(MiraClassModuleBase):
    id: str
    class_id: str
    ai_generated: bool
    source_outline_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- 1 à 12 modules par class (validation côté service)
- `UNIQUE DEFERRABLE` permet le reorder via batch update transactionnel
- Au passage `mira_class.status: validated_draft → enrichment_in_progress` : Group B propose d'importer automatiquement les `mira_class_module_outline` en `mira_class_module` (1:1 mapping avec `type='theory'` par défaut)
- **Suggestion IA module-par-module** (`POST /classes/{class_id}/modules/suggest`) :
  - Input : class_id (ses skills_taught + description) + nb modules souhaités + langue
  - Appel `LLMClient.suggest_class_modules(class_topic, hours, skills)` qui retourne N propositions de modules structurés
  - Persisté avec `ai_generated=TRUE` après validation mentor

## Relations

- **Référence** :
  - `class_id` → `mira_class.id` (référence logique, seedé en read côté Group B)
  - `source_outline_id` → `mira_class_module_outline.id` (référence logique cross-groupe)
- **Référencée par** :
  - `mira_class_module_skill.module_id`
  - `mira_class_session_module.module_id`
  - `mira_class_module_quiz.module_id`

## Routes API

```
POST   /v1/classes/{class_id}/modules                       — créer un module
GET    /v1/classes/{class_id}/modules                       — list ordonnée
GET    /v1/classes/{class_id}/modules/{id}                  — détail
PATCH  /v1/classes/{class_id}/modules/{id}                  — update
DELETE /v1/classes/{class_id}/modules/{id}                  — soft delete
PATCH  /v1/classes/{class_id}/modules/reorder               — réordonner (body : list d'ids)

# IA
POST   /v1/classes/{class_id}/modules/suggest               — appelle l'IA, retourne N propositions de modules
POST   /v1/classes/{class_id}/modules/from-outline          — import auto depuis mira_class_module_outline
```

## Seed attendu

Pour chaque `mira_class` seedée en `published` ou `enrichment_in_progress` : 4-6 modules détaillés avec type varié, durées cohérentes, descriptions réalistes.

## Reprenabilité

**Mapping** : `classes-api.mira_class_module` — schéma identique.

**Transformations** :
1. Migration directe + données
2. La méthode `suggest_class_modules` LLM devient HMAC vers `bots-api` (tool dédié)
3. Lien `source_outline_id` peut être abandonné post-hackathon (les outlines sont absorbés dans les modules)

**Effort** : ~2h Claude Code.
