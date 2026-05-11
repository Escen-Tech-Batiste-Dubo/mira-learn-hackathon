# skill_relation

**Possédé par** : Group C (write — seedé en pré-prep)
**Reprenabilité post-hackathon** : migration vers `skills-api.skill_relation` (nouveau service)

## Description fonctionnelle

Graphe de relations entre skills, utilisé par l'IA pour générer des parcours cohérents. 3 types de relations :
- `prerequisite_of` : skill A est un prérequis pour skill B (ordonner dans le parcours)
- `related_to` : skill A est connexe à skill B (suggérer ensemble)
- `builds_on` : skill A est un approfondissement de skill B (séquence naturelle d'apprentissage)

Pendant le hackathon : seedé en pré-prep (~20-30 relations) pour les 50 skills. En V1 prod : enrichi par curation admin + IA-suggested + community-contributed.

## Schéma SQL

```sql
CREATE TABLE skill_relation (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_skill_id UUID NOT NULL,                           -- ref skill.id
    to_skill_id UUID NOT NULL,                             -- ref skill.id

    relation_type VARCHAR(32) NOT NULL CHECK (relation_type IN (
        'prerequisite_of', 'related_to', 'builds_on'
    )),

    strength NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (strength BETWEEN 0 AND 1),
        -- force de la relation (1 = très fort, 0.5 = modéré)

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CHECK (from_skill_id != to_skill_id),
    UNIQUE (from_skill_id, to_skill_id, relation_type)
);

CREATE INDEX idx_skill_relation_from ON skill_relation (from_skill_id, relation_type);
CREATE INDEX idx_skill_relation_to ON skill_relation (to_skill_id, relation_type);
```

## Schéma Pydantic

```python
from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

RelationType = Literal["prerequisite_of", "related_to", "builds_on"]


class SkillRelationBase(BaseModel):
    from_skill_id: str
    to_skill_id: str
    relation_type: RelationType
    strength: Decimal = Field(default=Decimal("1.0"), ge=0, le=1)


class SkillRelationCreate(SkillRelationBase):
    pass


class SkillRelationRead(SkillRelationBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- `from_skill_id != to_skill_id` (pas d'auto-relation)
- `UNIQUE (from_skill_id, to_skill_id, relation_type)` : pas de doublons
- **Asymétrie** : `prerequisite_of(A, B)` ne crée pas auto `builds_on(B, A)` — relations explicites
- Utilisé par le moteur IA `student_learning_path` pour ordonner les steps

## Relations

- **Référence** : `from_skill_id`, `to_skill_id` → `skill.id`

## Routes API

```
GET    /v1/skills/{skill_id}/relations                      — toutes les relations sortantes
GET    /v1/skills/{skill_id}/prerequisites                  — skills qui sont prérequis (relations entrantes avec type=prerequisite_of)
GET    /v1/skills/{skill_id}/related                        — skills liées (type=related_to)

# Admin
POST   /v1/admin/skill-relations                            — créer
PATCH  /v1/admin/skill-relations/{id}                       — update strength
DELETE /v1/admin/skill-relations/{id}                       — supprimer
```

## Seed attendu

**~20-30 relations** seedées. Exemples :
- `prerequisite_of(lean-canvas, business-model-canvas)` strength=0.9
- `prerequisite_of(public-speaking, pitch-investor)` strength=0.7
- `related_to(figma-mastery, design-systems)` strength=0.8
- `builds_on(growth-hacking, lean-canvas)` strength=0.6
- `prerequisite_of(python-backend, api-design)` strength=0.8

Couverture : au moins 1-2 relations par skill clé du catalogue.

## Reprenabilité

**Mapping** : `skills-api.skill_relation` — schéma identique.

**Transformations** :
1. Migration directe vers nouveau service `skills-api`
2. UI admin pour curation post-hackathon
3. IA suggestion de nouvelles relations basées sur classes (post-V1.5)

**Effort** : ~1h Claude Code (couplé migration skill).
