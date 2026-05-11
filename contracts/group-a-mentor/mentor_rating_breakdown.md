# mentor_rating_breakdown

**Possédé par** : Group A (write — seedé hackathon, en V1 prod = vue matérialisée alimentée par `rates-api`)
**Reprenabilité post-hackathon** : vue matérialisée dans `mentors-api` croisant `rates-api` aggregates par sous-axe

## Description fonctionnelle

Détail de la note moyenne d'un mentor par sous-axe d'évaluation (pédagogie, présence, livrable, communauté). Permet d'afficher un radar chart ou des barres détaillées sur la fiche mentor.

Pendant le hackathon : table dénormalisée seedée statiquement. En V1 prod : vue matérialisée alimentée par `rates-api` qui agrège les reviews avec `target_type='mira_mentor'`.

## Schéma SQL

```sql
CREATE TABLE mentor_rating_breakdown (
    profile_id UUID NOT NULL PRIMARY KEY REFERENCES mentor_profile(id) ON DELETE CASCADE,

    -- 4 sous-axes (NULL si pas assez de reviews — quorum public ≥3 sessions)
    axis_pedagogy NUMERIC(3, 2) NULL CHECK (axis_pedagogy BETWEEN 0 AND 5),
    axis_presence NUMERIC(3, 2) NULL CHECK (axis_presence BETWEEN 0 AND 5),
    axis_deliverable NUMERIC(3, 2) NULL CHECK (axis_deliverable BETWEEN 0 AND 5),
    axis_community NUMERIC(3, 2) NULL CHECK (axis_community BETWEEN 0 AND 5),

    -- Trend (snapshot, comparaison vs période précédente — utile en V1.5)
    trend_3m_vs_6m_pct NUMERIC(5, 2) NULL,                 -- pourcentage de variation

    rating_count INTEGER NOT NULL DEFAULT 0,               -- même valeur que mentor_profile.rating_count (denorm)
    last_review_at TIMESTAMP WITH TIME ZONE NULL,

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MentorRatingBreakdownRead(BaseModel):
    profile_id: str
    axis_pedagogy: Optional[Decimal]
    axis_presence: Optional[Decimal]
    axis_deliverable: Optional[Decimal]
    axis_community: Optional[Decimal]
    trend_3m_vs_6m_pct: Optional[Decimal]
    rating_count: int
    last_review_at: Optional[datetime]
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- 1:1 avec `mentor_profile` (PK = profile_id)
- Tous les axes peuvent être NULL si `rating_count < 3` (pas affichage public sans quorum)
- En hackathon : seedé statiquement avec cohérence : `aggregate_rating` de `mentor_profile` = moyenne des 4 sous-axes (à ±0.1)

## Relations

- **Référence** : `profile_id` → `mentor_profile.id` (CASCADE)

## Routes API

```
GET    /v1/mentors/{slug}/rating-breakdown     — détail rating publique (sur fiche mentor)
```

## Seed attendu

Pour chaque `mentor_profile` avec `rating_count >= 3` (~12 sur les 15-20) :
- 4 axes seedés avec moyennes plausibles (ex : un mentor 4.7 global a `pedagogy=4.8`, `presence=4.6`, `deliverable=4.7`, `community=4.7`)
- Pour les 3-8 mentors avec `rating_count < 3` : les 4 axes restent NULL

## Reprenabilité

**Mapping** : pas de migration directe — devient vue matérialisée.

**Transformations post-hackathon** :
1. Dropper la table dénormalisée
2. Créer une vue matérialisée `mentor_rating_breakdown` dans `mentors-api` qui croise :
   - `rates-api.rate` filtré par `target_type='mira_mentor'` AND `target_id=mentor_profile.user_id`
   - Agrégat par sous-axe depuis `rates-api.rate.sub_scores` (JSONB)
3. Refresh trigger NATS event `rate.rate.published` ou cron nightly
4. Quorum public : 3 reviews minimum (sinon axes NULL)

**Effort** : ~2h Claude Code (vue + trigger + endpoint).
