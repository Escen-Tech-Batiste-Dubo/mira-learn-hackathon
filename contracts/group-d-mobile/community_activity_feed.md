# community_activity_feed

**Possédé par** : Group D (write — seedé pour démo)
**Reprenabilité post-hackathon** : extension `community-api` (consumer NATS multi-events)

## Description fonctionnelle

Feed d'événements anonymisés affiché côté mobile (Group D) dans la section "Trending in the community". Permet à l'étudiant de voir l'activité globale sans rentrer dans une logique compétitive nominative.

Format : événements pré-générés avec `display_text` déjà formaté et anonymisé, timestamps répartis sur les dernières 24-48h.

## Schéma SQL

```sql
CREATE TABLE community_activity_feed (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,

    event_type VARCHAR(64) NOT NULL CHECK (event_type IN (
        'skill_validated',
        'class_started',
        'enrolment_made',
        'class_published_soon',
        'mentor_validated',
        'cohort_completed',
        'milestone_reached'
    )),

    -- Affichage UI (pré-formaté + anonymisé)
    display_text TEXT NOT NULL,
        -- ex : "Une nomade vient de valider la skill 'Lean Canvas'"
        -- ex : "3 nouvelles inscriptions sur 'Pitch investisseur' à Lisbonne"
        -- ex : "Une class démarre demain à Bali"
    display_icon VARCHAR(32) NULL,                         -- ex 'graduation-cap', 'rocket'

    -- Context (JSON pour debug + future filtering, pas d'identifiants user directs)
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma examples :
        --   skill_validated : { "skill_name": "Lean Canvas", "skill_category": "business" }
        --   class_started   : { "class_title": "Pitch investor", "city": "Bali", "country": "Indonesia" }
        --   enrolment_made  : { "class_title": "...", "city": "Lisbon", "count": 3 }

    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,         -- date "fictive" affichée
    expires_at TIMESTAMP WITH TIME ZONE NULL,              -- après cette date, ne plus afficher
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_activity_feed_occurred ON community_activity_feed (occurred_at DESC)
    WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_community_activity_feed_event_type ON community_activity_feed (event_type, occurred_at DESC);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict

EventType = Literal[
    "skill_validated", "class_started", "enrolment_made",
    "class_published_soon", "mentor_validated", "cohort_completed",
    "milestone_reached"
]


class CommunityActivityFeedRead(BaseModel):
    id: str
    event_type: EventType
    display_text: str
    display_icon: Optional[str]
    context: dict[str, Any]
    occurred_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Anonymisation systématique** : aucun `user_id`, `display_name`, `email` ne doit apparaître dans `display_text` ou `context`. Phrasing pseudonymisé ("Une nomade", "Un nomad", "3 nomads").
- **RGPD** : pas de tracking GPS étudiant. Les villes affichées sont les villes de sessions (Group B), pas de l'utilisateur courant.
- Append-only pendant hackathon (seed statique). Expiration via `expires_at` pour cleanup nightly V1 prod.

## Relations

Aucune FK SQL. Les `context.skill_name` etc. sont des snapshots pour éviter les jointures cross-groupes.

## Routes API

```
GET    /v1/community/feed                                  — list paginée, filtres event_type optionnels
```

Pas d'endpoint POST pendant le hackathon (table seedée).

## Seed attendu

**30-50 events** seedés avec timestamps répartis sur les 48h passées (mix `occurred_at` pour démontrer fraîcheur). Distribution :
- ~12 `skill_validated` (skills variées)
- ~8 `enrolment_made` (avec counts +1, +3, +5)
- ~5 `class_started` (avec villes de sessions seedées)
- ~5 `mentor_validated` (mentors seedés Group A)
- ~5 `class_published_soon` (classes Group B)
- ~5 autres milestones

`display_text` réaliste et engageant, varié en formulation.

## Reprenabilité

**Mapping** : extension `community-api` avec une nouvelle table `community.activity_feed` alimentée par consommateurs NATS :
- `learn.skill.validated` → emit `skill_validated`
- `class.session.started` → emit `class_started`
- `class.enrolment.applied` → buffer 1h puis emit `enrolment_made` (count agrégé)
- `mentor.application.validated` → emit `mentor_validated`
- `class.class.published` → emit `class_published_soon`

**Anonymisation** : faite au moment de l'écriture du feed (jamais d'IDs user dans `display_text`).

**Effort** : ~3h Claude Code (consumers NATS + anonymisation).
