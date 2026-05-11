# mira_class_session_module

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_session_module`

## Description fonctionnelle

Table de planification qui place les **modules** (`mira_class_module`) dans le calendrier d'une **session** (`mira_class_session`). Définit pour chaque module quand il est joué (date+heure précise), sa durée effective dans cette session, et son URL de meeting si différent du default session.

Permet de tracker l'avancement (quel module est "actif" maintenant côté Group D mobile).

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SessionModuleStatus = Literal["scheduled", "in_progress", "completed", "skipped"]


class MiraClassSessionModuleBase(BaseModel):
    module_id: str
    position: int = Field(..., ge=1)
    scheduled_at: datetime
    duration_hours: Decimal = Field(..., gt=0)
    online_meeting_url: Optional[str] = Field(None, max_length=500)


class MiraClassSessionModuleCreate(MiraClassSessionModuleBase):
    pass


class MiraClassSessionModuleUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_hours: Optional[Decimal] = Field(None, gt=0)
    online_meeting_url: Optional[str] = None
    position: Optional[int] = Field(None, ge=1)


class MiraClassSessionModuleStart(BaseModel):
    pass


class MiraClassSessionModuleComplete(BaseModel):
    pass


class MiraClassSessionModuleRead(MiraClassSessionModuleBase):
    id: str
    session_id: str
    status: SessionModuleStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- Chaque module d'une class est planifié 1× dans la session (`UNIQUE session_id, module_id`)
- L'ordre dans la session peut différer de l'ordre dans la class (mais default = même ordre)
- `scheduled_at` doit être dans l'intervalle `[session.starts_at, session.ends_at]` (validation service)
- Transitions :
  - `scheduled → in_progress` : déclencheable manuellement par mentor au début du module
  - `scheduled → in_progress` : auto-trigger 5min avant `scheduled_at` (cron V1 prod)
  - `in_progress → completed` : manuellement par mentor à la fin
  - `scheduled|in_progress → skipped` : si le mentor décide de sauter
- À la création d'une session : Group B propose d'importer auto tous les modules de la class avec `scheduled_at` réparti uniformément entre `starts_at` et `ends_at`

## Relations

- **Référence** :
  - `session_id` → `mira_class_session.id` (CASCADE)
  - `module_id` → `mira_class_module.id`
- **Référencée par** :
  - `mira_class_session_module_material.session_module_id`

## Routes API

```
POST   /v1/sessions/{session_id}/modules                   — planifier un module dans la session
GET    /v1/sessions/{session_id}/modules                   — list ordonnée
PATCH  /v1/sessions/{session_id}/modules/{id}              — update (date, durée, URL)
PATCH  /v1/sessions/{session_id}/modules/{id}/start        — scheduled → in_progress
PATCH  /v1/sessions/{session_id}/modules/{id}/complete     — in_progress → completed
PATCH  /v1/sessions/{session_id}/modules/{id}/skip         — → skipped
DELETE /v1/sessions/{session_id}/modules/{id}              — retirer (soft, restaurable)
POST   /v1/sessions/{session_id}/modules/bulk-from-class   — import auto tous les modules de la class
```

## Seed attendu

Pour chaque session seedée (15-20) : 4-6 `mira_class_session_module` avec `scheduled_at` répartis sur la durée de la session. Mix de statuts cohérent avec le status session (`completed` modules pour session `completed`, etc.).

## Reprenabilité

**Mapping** : `classes-api.mira_class_session_module` — schéma identique.

**Transformations** :
1. Migration directe
2. Auto-transitions via cron + NATS events :
   - `class.session_module.started` → events-api (push notif inscrits "Module X commence")
   - `class.session_module.completed` → débloquer matériel `after` pour Group D

**Effort** : ~2h Claude Code.
