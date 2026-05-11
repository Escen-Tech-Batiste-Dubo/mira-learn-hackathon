# mira_class_module_outline

**Possédé par** : Group A (write)
**Reprenabilité post-hackathon** : migration partielle vers `classes-api.mira_class_module` (les outlines deviennent les modules détaillés)

## Description fonctionnelle

Le **programme grossier** d'une `mira_class` proposée pendant la candidature. Le candidat ne définit pas encore le contenu pédagogique précis (fichiers, exercices), juste un découpage en modules avec titre + durée estimée. Le contenu détaillé sera ajouté par Group B après validation (via `mira_class_module` enrichi).

Exemple : pour la class "Pitcher pour lever 500k" (10h total), l'outline propose 4 modules :
1. "Comprendre les attentes investisseurs" (2h)
2. "Construire ton pitch deck" (3h)
3. "Storytelling + démonstration" (3h)
4. "Q&A + objections" (2h)

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class MiraClassModuleOutlineBase(BaseModel):
    position: int = Field(..., ge=1)
    title: str = Field(..., max_length=200)
    estimated_duration_hours: Decimal = Field(..., gt=0)


class MiraClassModuleOutlineCreate(MiraClassModuleOutlineBase):
    pass


class MiraClassModuleOutlineUpdate(BaseModel):
    position: int | None = Field(None, ge=1)
    title: str | None = Field(None, max_length=200)
    estimated_duration_hours: Decimal | None = Field(None, gt=0)


class MiraClassModuleOutlineRead(MiraClassModuleOutlineBase):
    id: str
    class_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- Au minimum 3 outlines, au maximum 8 outlines par class (validation côté service)
- `UNIQUE (class_id, position)` : pas de doublons d'ordre
- À la réorganisation (drag-and-drop dans Group B), repositionner via transaction batch update
- La somme des `estimated_duration_hours` devrait être proche de `mira_class.total_hours` (warning si écart >20%)
- Modifiable uniquement en `mira_class.status IN ('draft', 'submitted', 'validated_draft')` — après publication c'est `mira_class_module` qui prend le relais

## Relations

- **Référence** : `class_id` → `mira_class.id` (CASCADE)
- **Référencée par** : aucune (table feuille)

## Routes API

```
POST   /v1/mentors/applications/me/classes/{class_id}/outlines             — ajouter un outline
GET    /v1/mentors/applications/me/classes/{class_id}/outlines             — list ordonnée
PATCH  /v1/mentors/applications/me/classes/{class_id}/outlines/{id}        — update titre/durée
PATCH  /v1/mentors/applications/me/classes/{class_id}/outlines/reorder     — réordonner (body : [{id, position}])
DELETE /v1/mentors/applications/me/classes/{class_id}/outlines/{id}        — supprimer
```

## Seed attendu

Pour chaque `mira_class` seedée en `submitted`/`validated_draft`/`published` : 3-6 outlines avec titres et durées réalistes (cohérent avec le sujet de la class).

## Reprenabilité

**Mapping** : Les outlines sont **upgrade**és vers `classes-api.mira_class_module` au moment du déménagement. Chaque outline (`title`, `position`, `estimated_duration_hours`) devient un `mira_class_module` avec en plus : `description`, `type`, `duration_hours` (precise vs estimée), et les enrichissements de Group B.

**Transformations** :
1. Migration data : `INSERT INTO mira_class_module (id, class_id, position, title, duration_hours, type) SELECT id, class_id, position, title, estimated_duration_hours, 'theory' FROM mira_class_module_outline`
2. Marquer `type='theory'` par défaut (mentor ajustera ensuite)
3. Drop la table `mira_class_module_outline` post-migration (rôle absorbé par `mira_class_module`)

**Effort** : ~1h Claude Code.
