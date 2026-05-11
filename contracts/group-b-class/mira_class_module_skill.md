# mira_class_module_skill

**Possédé par** : Group B (write)
**Reprenabilité post-hackathon** : migration vers `classes-api.mira_class_module_skill`

## Description fonctionnelle

Skills associées à un module pédagogique (sous-ensemble des `skills_taught` de la class). Permet au mentor de préciser quelles skills sont travaillées dans chaque module — utile pour Group D (validation skill par QCM module) et Group C (parcours apprenant qui mappe étape → modules).

## Schéma SQL

```sql
CREATE TABLE mira_class_module_skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES mira_class_module(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL,                                -- ref skill.id

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,             -- skill principale du module (1 par module recommandé)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (module_id, skill_id)
);

CREATE INDEX idx_mira_class_module_skill_module_id ON mira_class_module_skill (module_id);
CREATE INDEX idx_mira_class_module_skill_skill_id ON mira_class_module_skill (skill_id);
```

## Schéma Pydantic

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MiraClassModuleSkillBase(BaseModel):
    skill_id: str
    is_primary: bool = False


class MiraClassModuleSkillCreate(MiraClassModuleSkillBase):
    pass


class MiraClassModuleSkillRead(MiraClassModuleSkillBase):
    id: str
    module_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- 1-3 skills par module recommandé (pas de hard limit)
- Les skills d'un module doivent être un sous-ensemble des `mira_class.skills_taught` (validation côté service)
- À la suppression du module : cascade

## Relations

- **Référence** :
  - `module_id` → `mira_class_module.id` (CASCADE)
  - `skill_id` → `skill.id`

## Routes API

```
PUT    /v1/classes/{class_id}/modules/{module_id}/skills   — set complète
POST   /v1/classes/{class_id}/modules/{module_id}/skills   — ajouter
DELETE /v1/classes/{class_id}/modules/{module_id}/skills/{skill_id}  — retirer
```

## Seed attendu

Pour chaque module seedé : 1-3 skills associées (parmi les `skills_taught` de la class).

## Reprenabilité

**Mapping** : `classes-api.mira_class_module_skill` — schéma identique.

**Effort** : ~30 min.
