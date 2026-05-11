# mira_class_enrolment

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_enrolment` (ou nouveau `booking-api` selon arbitrage final)

## Description fonctionnelle

Inscription d'un apprenant à une `mira_class_session`. State machine :
- `applied` : candidat a postulé (avec form de validation participation potentiellement)
- `waitlist` : capacité atteinte, en liste d'attente (avec position)
- `accepted` : mentor a validé l'inscription
- `rejected` : mentor a refusé
- `cancelled` : apprenant a annulé avant démarrage
- `completed` : session terminée

L'inscription stocke aussi les réponses à un éventuel formulaire de validation (`application_data` JSONB).

## Schéma SQL

```sql
CREATE TABLE mira_class_enrolment (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mira_class_session(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,                                 -- ref Supabase auth.users.id

    -- State machine
    status VARCHAR(32) NOT NULL DEFAULT 'applied' CHECK (status IN (
        'applied', 'waitlist', 'accepted', 'rejected', 'cancelled', 'completed'
    )),
    waitlist_position INTEGER NULL CHECK (waitlist_position IS NULL OR waitlist_position >= 1),

    -- Données saisies par l'apprenant lors de la postulation
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma libre : réponses au form de validation participation, motivations, etc.

    -- Décision mentor
    decision_at TIMESTAMP WITH TIME ZONE NULL,
    decision_by_mentor_id UUID NULL,                       -- ref Supabase auth.users.id (mentor)
    decision_reason TEXT NULL,                             -- obligatoire si status='rejected'

    -- Annulation apprenant
    cancellation_at TIMESTAMP WITH TIME ZONE NULL,
    cancellation_reason TEXT NULL,

    -- Complétion
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    completion_score_pct NUMERIC(5, 2) NULL,               -- moyenne scores QCM si applicable

    -- Audit
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (session_id, user_id) WHERE status NOT IN ('cancelled', 'rejected')
        -- un user peut se ré-inscrire après cancel/reject
);

CREATE INDEX idx_mira_class_enrolment_session_id ON mira_class_enrolment (session_id, status);
CREATE INDEX idx_mira_class_enrolment_user_id ON mira_class_enrolment (user_id, status);
CREATE INDEX idx_mira_class_enrolment_waitlist ON mira_class_enrolment (session_id, waitlist_position)
    WHERE status = 'waitlist';
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

EnrolmentStatus = Literal[
    "applied", "waitlist", "accepted", "rejected", "cancelled", "completed"
]


class MiraClassEnrolmentCreate(BaseModel):
    """Postulation par l'apprenant."""
    application_data: dict[str, Any] = {}


class MiraClassEnrolmentDecision(BaseModel):
    """Décision mentor (accept/reject)."""
    decision: Literal["accepted", "rejected"]
    decision_reason: Optional[str] = Field(None, max_length=2000)


class MiraClassEnrolmentCancel(BaseModel):
    """Annulation par l'apprenant."""
    cancellation_reason: Optional[str] = Field(None, max_length=2000)


class MiraClassEnrolmentRead(BaseModel):
    id: str
    session_id: str
    user_id: str
    status: EnrolmentStatus
    waitlist_position: Optional[int]
    application_data: dict[str, Any]
    decision_at: Optional[datetime]
    decision_by_mentor_id: Optional[str]
    decision_reason: Optional[str]
    cancellation_at: Optional[datetime]
    cancellation_reason: Optional[str]
    completed_at: Optional[datetime]
    completion_score_pct: Optional[Decimal]
    enrolled_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

### State machine
| De | Vers | Acteur | Notes |
|---|---|---|---|
| (new) | `applied` | Apprenant | À la postulation |
| (new) | `waitlist` | Système | Si session capacité atteinte (auto, en transaction) |
| `applied` | `accepted` | Mentor | Décision via `POST /enrolments/{id}/decision` |
| `applied` | `rejected` | Mentor | `decision_reason` obligatoire |
| `applied` | `cancelled` | Apprenant | Annulation avant décision |
| `waitlist` | `applied` | Système | Promotion auto si place libérée + position 1 |
| `waitlist` | `cancelled` | Apprenant | |
| `accepted` | `cancelled` | Apprenant | Annulation post-acceptation |
| `accepted` | `completed` | Système | Trigger fin session (auto) |

### Règles

- **Auto-passage `applied → waitlist`** si `session.enrolment_count >= session.capacity` ET `session.waitlist_enabled = TRUE`
- **Promotion waitlist** : à chaque `cancelled`/`rejected` d'un `accepted`, le premier en waitlist (`waitlist_position=1`) passe en `applied` (notif envoyée pour validation mentor)
- **Compteurs session** : `mira_class_session.enrolment_count` (=COUNT accepted) et `waitlist_count` (=COUNT waitlist) mis à jour via trigger ou service à chaque transition
- **`completion_score_pct`** : calculé à la complétion = moyenne des scores `student_quiz_attempt` (Group D) sur les quizzes de la session

## Relations

- **Référence** :
  - `session_id` → `mira_class_session.id` (CASCADE)
  - `user_id` → Supabase `auth.users.id`

## Routes API

### Apprenant (consommé par Group C qui propose le form)
```
POST   /v1/sessions/{session_id}/enrolments                — postuler
GET    /v1/me/enrolments                                   — mes inscriptions
GET    /v1/me/enrolments/{id}                              — détail
POST   /v1/me/enrolments/{id}/cancel                       — annuler
```

### Mentor
```
GET    /v1/sessions/{session_id}/enrolments                — list candidatures (filtres status)
GET    /v1/enrolments/{id}                                 — détail (avec application_data)
POST   /v1/enrolments/{id}/decision                        — accept/reject
```

## Seed attendu

- **5-10 inscriptions par session seedée**, mix de statuts :
  - Sessions `open_enrolment` : mix `applied`/`waitlist`/`accepted`
  - Sessions `in_progress` : majoritairement `accepted`
  - Sessions `completed` : majoritairement `completed` (avec `completion_score_pct` cohérent)
  - Quelques `cancelled` et 1-2 `rejected` pour démontrer
- `application_data` réaliste avec 2-3 questions/réponses fictives

## Reprenabilité

**Mapping** : `classes-api.mira_class_enrolment` — schéma identique.

**Transformations** :
1. Migration directe schéma + données
2. Intégration `payment-api` + `subscriptions-api` (Mira Pass paywall) au moment de la postulation (V1 prod)
3. NATS events :
   - `class.enrolment.applied` (consume messaging-api pour notif mentor)
   - `class.enrolment.accepted` (consume chats-api pour ajout Tribes channel + messaging-api email confirmation)
   - `class.enrolment.completed` (consume rates-api + learn-api)
4. RGPD : conserver 5 ans après `completed_at` (obligations comptables si payant)

**Effort** : ~3-4h Claude Code.
