# skill_demand_aggregate

**Possédé par** : Group A (write — alimenté par seed, en V1 prod alimenté par cron)
**Reprenabilité post-hackathon** : vue matérialisée `users-api` ou nouveau service `stats-api` croisant `users-api.target_skills` + `classes-api.skills_taught`

## Description fonctionnelle

Snapshot agrégé qui mesure pour chaque skill :
- Combien d'étudiants veulent l'apprendre (`students_wanting_count`)
- Combien de mentors actifs l'enseignent (`mentors_offering_count`)
- Le gap = pression de demande non satisfaite (`gap_score`)

Pendant le hackathon : table **seedée statiquement** (snapshot fictif réaliste). Le moteur de suggestions IA `mira_class_ai_suggestion` lit cette table pour orienter le candidat vers des skills "high demand low offer".

## Schéma SQL

```sql
CREATE TABLE skill_demand_aggregate (
    skill_id UUID NOT NULL PRIMARY KEY,                    -- ref skill.id

    students_wanting_count INTEGER NOT NULL DEFAULT 0 CHECK (students_wanting_count >= 0),
    mentors_offering_count INTEGER NOT NULL DEFAULT 0 CHECK (mentors_offering_count >= 0),
    active_classes_count INTEGER NOT NULL DEFAULT 0,        -- nombre de mira_class published avec cette skill
    gap_score NUMERIC(6, 2) NOT NULL DEFAULT 0,             -- computed : students_wanting / max(mentors_offering, 1)

    period_label VARCHAR(32) NOT NULL DEFAULT 'current_snapshot',
        -- en V1 prod : 'week_2026-19', 'month_2026-05', etc.

    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_demand_aggregate_gap ON skill_demand_aggregate (gap_score DESC);
CREATE INDEX idx_skill_demand_aggregate_demand ON skill_demand_aggregate (students_wanting_count DESC);
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class SkillDemandAggregateRead(BaseModel):
    skill_id: str
    students_wanting_count: int = Field(..., ge=0)
    mentors_offering_count: int = Field(..., ge=0)
    active_classes_count: int = Field(..., ge=0)
    gap_score: Decimal
    period_label: str
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- `gap_score` = `students_wanting_count / max(mentors_offering_count, 1)`. Plus haut = plus grosse opportunité mentor.
- Table snapshot uniquement : pas de UPDATE pendant hackathon (les seeds figés). En V1 prod, recalcul nightly.
- `skill_id` est PRIMARY KEY (1 ligne par skill).

## Relations

- **Référence** : `skill_id` → `skill.id` (référence logique)
- **Consommée par** :
  - Moteur de suggestions IA `mira_class_ai_suggestion` (Group A)
  - Optionnellement : visualisation publique "Skills demandées" si on veut ajouter cette page (cf. discussion Option 2)

## Routes API

```
GET    /v1/skills/demand                                   — list par gap_score DESC (top 10 par défaut)
GET    /v1/skills/{skill_id}/demand                        — détail demande pour une skill
```

Internal :
```
GET    /internal/skills/demand/aggregate                   — appelé par le moteur IA mira_class_ai_suggestion
```

## Seed attendu

**50 lignes** (1 par skill seedée). Distribution réaliste pour démontrer la valeur du moteur IA :
- **~30% high gap** (`students_wanting=40-80`, `mentors_offering=0-2`) → vraies opportunités IA
- **~50% balanced** (`students_wanting=15-40`, `mentors_offering=3-8`)
- **~20% over-supply** (`students_wanting=5-15`, `mentors_offering=8-12`)

Exemple :
- `pitch-investor` : `students_wanting=68`, `mentors_offering=1`, `gap_score=68.0` → high gap, IA suggère
- `ui-design` : `students_wanting=25`, `mentors_offering=5`, `gap_score=5.0` → balanced
- `language-english` : `students_wanting=8`, `mentors_offering=12`, `gap_score=0.67` → over-supply

## Reprenabilité

**Mapping** : pas de migration directe — c'est une donnée seedée pour démo.

**Transformations post-hackathon** :
1. Créer une vue matérialisée dans le bon service (probablement `classes-api` ou nouveau `stats-api`)
2. Source réelle :
   - `students_wanting_count` = count(`users-api.target_skills` contains skill_id)
   - `mentors_offering_count` = count(`mentors-api.mentor_skill` où skill_id, status=active)
   - `active_classes_count` = count(`classes-api.mira_class` published où skill_id in skills_taught)
3. Refresh cron nightly
4. Conserver le pattern `gap_score` pour le moteur IA `bots-api` (qui utilisera la vue matérialisée à la place du seed statique)

**Effort** : ~2h Claude Code (vue + cron + endpoint).
