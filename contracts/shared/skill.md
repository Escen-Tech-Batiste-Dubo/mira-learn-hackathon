# skill

**Possédé par** : Shared (référentiel transverse, seedé identiquement dans toutes les Supabase de tous les groupes)
**Reprenabilité post-hackathon** : migration vers `skills-api.skill` (nouveau service backbone)

## Description fonctionnelle

Le référentiel canonique des compétences (skills) de la plateforme Hello Mira. Une skill représente une compétence métier (ex : "Pitch investor", "Lean Canvas", "UX research").

Utilisée par :
- **Group A** : skills déclarées par le candidat mentor + skills prodiguées par les classes proposées
- **Group B** : skills associées à chaque module pédagogique
- **Group C** : skills cibles de l'étudiant + skills validées + skills dans les parcours
- **Group D** : skills validées via QCM (référence affichée)

## Schéma SQL

```sql
CREATE TABLE skill (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(32) NOT NULL CHECK (category IN (
        'business', 'design', 'tech', 'soft', 'lifestyle'
    )),
    popularity_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_skill_category ON skill (category) WHERE deleted_at IS NULL;
CREATE INDEX idx_skill_popularity ON skill (popularity_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_skill_name_trgm ON skill USING gin (name gin_trgm_ops);  -- recherche fuzzy
```

**Extension requise** : `CREATE EXTENSION IF NOT EXISTS pg_trgm;` pour la recherche textuelle.

## Schéma Pydantic (FastAPI)

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SkillCategory = Literal["business", "design", "tech", "soft", "lifestyle"]


class SkillBase(BaseModel):
    slug: str = Field(..., max_length=64, pattern=r"^[a-z0-9-]+$")
    name: str = Field(..., max_length=120)
    description: str = ""
    category: SkillCategory
    popularity_score: int = Field(default=0, ge=0)


class SkillCreate(SkillBase):
    """Création par admin uniquement."""
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    popularity_score: Optional[int] = Field(None, ge=0)


class SkillRead(SkillBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- Le `slug` est l'identifiant fonctionnel stable et public. Format : kebab-case minuscule (ex : `pitch-investor`, `lean-canvas`, `ux-research`).
- Le `name` est le label humain (UI). Peut différer du slug (capitalisations, espaces).
- `popularity_score` est un compteur dénormalisé (combien de fois la skill apparaît dans des profils mentor/student + dans des classes). Recalculé périodiquement (nightly post-hackathon, fixe pendant le hackathon).
- 5 catégories canoniques : `business`, `design`, `tech`, `soft`, `lifestyle`. Pas d'autres valeurs autorisées.
- Pas de suppression physique → soft delete uniquement (les skills suivies par des students/mentors doivent rester historisées).

## Relations

- Référencée par (intra-groupe) :
  - `mentor_application_skill.skill_id` (Group A)
  - `mentor_profile_skill.skill_id` (Group A)
  - `mira_class.skills_taught[]` (Group A, JSONB array)
  - `mira_class_module_skill.skill_id` (Group B)
  - `student_skill.skill_id` (Group C)
  - `student_profile.target_skills[]` (Group C, JSONB array)
  - `student_learning_path_step.skill_id` (Group C)
  - `skill_relation.from_skill_id`, `skill_relation.to_skill_id` (Group C)
  - `skill_demand_aggregate.skill_id` (Group A)
  - `trending_skill_view.skill_id` (Group D)
- Aucune dépendance sortante (pas de FK vers d'autres tables).

## Seed attendu

**50 skills** seedés identiquement dans les 4 Supabase de groupes, répartis sur 5 catégories (~10 skills par catégorie).

Exemples par catégorie :

**business** : `pitch-investor`, `lean-canvas`, `business-model-canvas`, `pricing-strategy`, `funding-strategy`, `go-to-market-b2b`, `growth-hacking`, `unit-economics`, `revenue-operations`, `partnership-strategy`

**design** : `ui-design`, `ux-research`, `figma-mastery`, `design-systems`, `motion-design`, `brand-identity`, `webflow-mastery`, `typography`, `prototyping`, `design-thinking`

**tech** : `python-backend`, `react-frontend`, `flutter-mobile`, `postgresql-mastery`, `devops-aws`, `docker-kubernetes`, `data-engineering`, `prompt-engineering`, `api-design`, `system-architecture`

**soft** : `public-speaking`, `negotiation`, `leadership`, `time-management`, `feedback-giving`, `conflict-resolution`, `remote-collaboration`, `mentoring`, `decision-making`, `storytelling`

**lifestyle** : `digital-nomadism`, `productivity-systems`, `mindfulness`, `nutrition-basics`, `fitness-routine`, `language-spanish`, `language-english`, `personal-finance`, `solo-travel`, `community-building`

`popularity_score` : varier de 0 à 200 pour permettre des comportements de tri réalistes (skills populaires en haut de l'annuaire mentor).

## Reprenabilité post-hackathon

**Mapping cible** : `skills-api.skill` (nouveau microservice backbone à créer post-hackathon, cf. PRD V3 + refonte V2 Lorenzo).

**Transformations à effectuer** :
1. Migrer la table `skill` depuis les 4 Supabase de hackathon → 1 instance unique dans `skills-api.skill` (PostgreSQL backbone)
2. **Déduplication** : si les groupes ont chacun ajouté des skills custom pendant le hackathon (peu probable mais possible), réconcilier sur le `slug` (UNIQUE constraint le détecte)
3. Conserver tous les champs + `created_at`/`updated_at` original
4. Étendre le schéma avec :
   - `i18n_translations` (JSONB) — labels EN/ES (V1.5)
   - `parent_skill_id` (UUID) — taxonomie hiérarchique éventuelle V1.5
5. Migration Alembic dédiée + script SQL de copie

**Effort estimé** : ~2-3h Claude Code.

## Notes implémentation

- Pour la recherche par autocomplete (Group A skill picker + Group C target skills) : utiliser l'index `gin_trgm_ops` pour `ILIKE '%query%'` rapide
- Pour les filtres annuaire par catégorie : `WHERE category = 'business' AND deleted_at IS NULL`
- Le seed identique entre groupes est **crucial** : les `skill_id` doivent être les **mêmes UUID** dans les 4 Supabase pour permettre les références cross-data seedée (ex : `mentor_directory` côté Group C référence des skill_id qui doivent exister dans Group C Supabase)
