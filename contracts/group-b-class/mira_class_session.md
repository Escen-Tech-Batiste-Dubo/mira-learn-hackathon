# mira_class_session

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_session`

## Description fonctionnelle

Une **session** est une instance datée d'une `mira_class` publiée. Le mentor programme des sessions à des dates précises (physique dans une ville, ou virtuel). Chaque session a une capacité et reçoit des inscriptions (`mira_class_enrolment`).

State machine session :
- `planned` : créée mais pas encore ouverte aux inscriptions
- `open_enrolment` : visible au catalogue, accepte inscriptions
- `full` : capacité atteinte (passage auto via trigger)
- `in_progress` : session démarrée (modules en cours)
- `completed` : terminée
- `cancelled` : annulée (refunds enrolments si applicable)

## Schéma SQL

```sql
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
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SessionType = Literal["physical", "virtual", "hybrid"]
SessionStatus = Literal[
    "planned", "open_enrolment", "full", "in_progress", "completed", "cancelled"
]
MeetingProvider = Literal["zoom", "meet", "livekit", "other"]


class MiraClassSessionBase(BaseModel):
    type: SessionType
    location_address: Optional[str] = Field(None, max_length=500)
    location_city: Optional[str] = Field(None, max_length=120)
    location_country: Optional[str] = Field(None, max_length=120)
    location_lat: Optional[Decimal] = None
    location_lng: Optional[Decimal] = None
    online_meeting_provider: Optional[MeetingProvider] = None
    online_meeting_default_url: Optional[str] = Field(None, max_length=500)
    capacity: int = Field(default=10, ge=1, le=50)
    waitlist_enabled: bool = True
    waitlist_max_size: int = Field(default=20, ge=0)
    price_cents: int = Field(default=0, ge=0)
    starts_at: datetime
    ends_at: datetime
    enrolment_deadline: Optional[datetime] = None


class MiraClassSessionCreate(MiraClassSessionBase):
    pass


class MiraClassSessionUpdate(BaseModel):
    """Update pendant 'planned' uniquement (sauf cancellation)."""
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1, le=50)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    enrolment_deadline: Optional[datetime] = None


class MiraClassSessionPublish(BaseModel):
    """Ouvrir aux inscriptions : planned → open_enrolment."""
    pass


class MiraClassSessionCancel(BaseModel):
    cancellation_reason: str = Field(..., max_length=500)


class MiraClassSessionPromote(BaseModel):
    promoted_until: datetime


class MiraClassSessionRead(MiraClassSessionBase):
    id: str
    class_id: str
    status: SessionStatus
    cancellation_reason: Optional[str]
    is_promoted: bool
    promoted_until: Optional[datetime]
    enrolment_count: int
    waitlist_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Type cohérence** : `virtual` → pas de location_address ; `physical|hybrid` → location_address obligatoire (CHECK SQL)
- **Dates cohérentes** : `ends_at > starts_at` (CHECK SQL)
- **`enrolment_deadline` default** : `starts_at - 24h` à la création si NULL
- **Compteurs dénormalisés** : `enrolment_count` et `waitlist_count` mis à jour par triggers ou service à chaque transition de `mira_class_enrolment`
- **Auto-transition `open_enrolment → full`** : trigger quand `enrolment_count >= capacity` ET `waitlist_enabled = FALSE`
- **Auto-transition `... → in_progress → completed`** : cron job au passage des dates (V1 prod). En hackathon : manuel.
- **Cancellation** : `cancellation_reason` obligatoire. Notifie tous les inscrits + refund.

## Relations

- **Référence** : `class_id` → `mira_class.id`
- **Référencée par** :
  - `mira_class_session_module.session_id`
  - `mira_class_session_module_material.session_module_id` (transitivement)
  - `mira_class_enrolment.session_id`

## Routes API

```
POST   /v1/classes/{class_id}/sessions                     — créer
GET    /v1/classes/{class_id}/sessions                     — list
GET    /v1/sessions/{id}                                   — détail
PATCH  /v1/sessions/{id}                                   — update
POST   /v1/sessions/{id}/publish                           — planned → open_enrolment
POST   /v1/sessions/{id}/start                             — open_enrolment → in_progress
POST   /v1/sessions/{id}/complete                          — in_progress → completed
POST   /v1/sessions/{id}/cancel                            — cancellation
POST   /v1/sessions/{id}/promote                           — boost visibilité

# Public (catalogue)
GET    /v1/sessions/public                                 — list sessions open_enrolment (catalogue Group C)
```

## Seed attendu

- **15-20 sessions** réparties sur les classes published seedées
- Mix réaliste :
  - 5 sessions `open_enrolment` à des dates futures (1-3 mois) — pour démo inscription
  - 5 sessions `in_progress` en ce moment — pour démo carte mondiale Group D
  - 5 sessions `completed` passées (pour stats + reviews)
  - 1 session `cancelled` (démo gestion)
- Localisations mondiales variées : Barcelone, Lisbonne, Bali, Mexico City, Cape Town, Bangkok, Buenos Aires, Tbilisi, Medellín, Chiang Mai, Marrakech, Tulum
- Mix `physical` / `virtual` (~50/50)

## Reprenabilité

**Mapping** : `classes-api.mira_class_session` — schéma identique.

**Transformations** :
1. Migration directe schéma + données
2. Pricing : intégration avec `payment-api` + `ledger-api` + Mira Pass paywall (subscriptions-api)
3. Géolocalisation : enrichissement via `geo-api` (geocoding city → lat/lng si pas fourni)
4. Auto-transitions via cron `classes-api` :
   - `open_enrolment → full` : trigger à chaque update enrolment_count
   - `... → in_progress` : cron daily checking `starts_at <= NOW()`
   - `in_progress → completed` : cron daily checking `ends_at < NOW()`
5. NATS events :
   - `class.session.published` → community-api (activity feed)
   - `class.session.started` → events-api (notifs inscrits)
   - `class.session.completed` → rates-api (trigger reviews) + learn-api (validation skills)
   - `class.session.cancelled` → payment-api (refunds)

**Effort** : ~4-5h Claude Code (entité avec beaucoup de transitions + intégrations).
