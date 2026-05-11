# Contrats d'interface — Schémas d'entités hackathon

Définition canonique des **entités** que chaque groupe doit implémenter. **Tout naming, type, contrainte et default est non-négociable** : c'est ce qui garantit la reprenabilité Claude Code post-hackathon (mapping mécanique vers nos microservices Hello Mira).

## Conventions transversales (TOUS LES GROUPES)

### Naming
- Tables : `snake_case` au pluriel implicite (ex : `mentor_application`, pas `mentor_applications`)
- Colonnes : `snake_case`
- Foreign keys : `{entity}_id` (ex : `mentor_id`, `class_id`)
- Enums : valeurs en `snake_case`, stockés en VARCHAR + CHECK constraint (pas ENUM PostgreSQL)
- Index : `idx_{table}_{colonnes}`

### Types canoniques
| Concept | Type SQL | Type Pydantic | Notes |
|---|---|---|---|
| ID primaire | `UUID NOT NULL DEFAULT uuid_generate_v4()` | `str` (UUID v4) | Jamais d'auto-increment |
| Foreign key | `UUID NOT NULL` ou `UUID NULL` | `str` ou `Optional[str]` | Pas de FK DB strict (groupes indépendants) — référence logique |
| Texte court | `VARCHAR(255)` | `str` (max 255) | Titres, slugs, URLs |
| Texte moyen | `TEXT` | `str` | Bios, descriptions |
| Texte riche | `TEXT` (markdown) | `str` | Markdown documenté |
| Booléen | `BOOLEAN NOT NULL DEFAULT FALSE` | `bool` | Toujours NOT NULL avec default |
| Entier | `INTEGER` ou `BIGINT` | `int` | BIGINT si compteur potentiel >2^31 |
| Montant | `BIGINT NOT NULL` (centimes) | `int` | Jamais NUMERIC/FLOAT pour argent |
| Décimal | `NUMERIC(5, 2)` | `Decimal` | Ratings, pourcentages |
| Date+heure | `TIMESTAMP WITH TIME ZONE` | `datetime` | UTC obligatoire |
| JSON structuré | `JSONB` | `dict` ou modèle Pydantic | **Schéma documenté en commentaire SQL** |
| JSON array | `JSONB` | `list[...]` | Idem |
| Enum | `VARCHAR(32) NOT NULL CHECK (col IN (...))` | `Literal[...]` | Valeurs documentées |

### Audit obligatoire (TOUTES tables business)
```sql
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMP WITH TIME ZONE NULL  -- soft delete
```

Trigger ou hook SQLAlchemy pour `updated_at = NOW()` à chaque UPDATE.

### Filtrage soft delete
Toutes les requêtes par défaut filtrent `WHERE deleted_at IS NULL`. Soft delete uniquement (pas de DELETE physique sauf RGPD explicite).

### Foreign keys logiques (pas DB strict)
Comme chaque groupe a sa propre Supabase, on ne peut pas avoir de vraies foreign keys cross-tables possédées par d'autres groupes. Convention :
- Pour les FK **intra-groupe** : `FOREIGN KEY (col) REFERENCES table(id) ON DELETE CASCADE`
- Pour les FK **cross-groupe ou cross-service** (ex : `user_id` qui vient de Supabase Auth) : pas de FK SQL, juste un commentaire `-- ref Supabase auth.users.id`

### Indexes obligatoires
- `id` : index automatique (PRIMARY KEY)
- Toute FK : index obligatoire pour performance
- Champs filtrés/triés régulièrement : index dédié
- `deleted_at` : index partiel `WHERE deleted_at IS NULL` si table > 10 000 lignes attendues

## Format des fichiers de contrat

Chaque entité a son propre fichier `.md` dans le sous-dossier de son groupe propriétaire. Format standard :

```markdown
# {entity_name}

**Possédé par** : Group X
**Reprenabilité post-hackathon** : migration vers `{service-api}.{table}`

## Description fonctionnelle
Description métier en 1-3 phrases.

## Schéma SQL
\```sql
CREATE TABLE {entity_name} (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    ...
);

CREATE INDEX idx_... ON {entity_name} (...);
\```

## Schéma Pydantic (FastAPI)
\```python
class EntityNameBase(BaseModel):
    ...

class EntityNameCreate(EntityNameBase):
    ...

class EntityNameRead(EntityNameBase):
    id: str
    created_at: datetime
    updated_at: datetime
\```

## Contraintes métier
- Liste des règles non-évidentes...

## Relations
- FK vers ... (intra/cross-groupe)
- Consommée par : ...

## Seed attendu
- Volume seedé pour la démo : N lignes
- Cas couverts par le seed : ...

## Reprenabilité post-hackathon
Mapping vers le service Hello Mira cible + transformations à effectuer.
```

## Liste des entités par groupe (récap)

### Shared (référentiel commun, seedé identiquement dans toutes les Supabase)
- `skill`
- (à compléter selon besoins)

### Group A — Mentor (candidature + annuaire + propositions classes)
- `mentor_application`
- `mentor_application_skill`
- `mentor_cv_import`
- `mira_class` (coquille — Group A en write, Group B en read seed)
- `mira_class_module_outline`
- `mira_class_ai_suggestion`
- `skill_demand_aggregate`
- `mentor_profile`
- `mentor_profile_skill`
- `mentor_rating_breakdown`

### Group B — Classes & sessions (enrichissement post-validation)
- `mira_class_module`
- `mira_class_module_skill`
- `mira_class_session`
- `mira_class_session_module`
- `mira_class_session_module_material`
- `mira_class_module_quiz`
- `mira_class_module_quiz_question`
- `mira_class_module_quiz_option`
- `mira_class_enrolment`

### Group C — Catalogue + profil + parcours apprenant
- `student_profile`
- `student_skill`
- `student_cv_import`
- `student_enrolment_intent`
- `student_learning_path`
- `student_learning_path_step`
- `student_path_regeneration_log`
- `skill_relation`
- (read seed) `mentor_directory`, `class_directory`

### Group D — Mobile (suivi class + notes + QCM + communauté)
- `student_note`
- `student_note_organization`
- `student_quiz_attempt`
- `student_quiz_answer`
- `community_activity_feed`
- (read seed) `student_class_view`, `mira_class_module_quiz*`, `global_active_session_view`, `trending_skill_view`, `trending_destination_view`, `featured_mentor_view`

## Cohérence des seeds inter-Supabase

**Point critique pré-prep** : les 4 groupes ont chacun leur propre projet Supabase pendant le hackathon. Pour que la démo cross-groupes soit cohérente (Antoine candidat dans Group A = Antoine mentor dans Group B = Antoine sur la fiche de Group C…), les **UUIDs des entités partagées doivent être identiques** dans les 4 Supabase.

### Mécanisme

Louis (pré-prep) génère un fichier de référence `shared-seed-ids.json` qui contient :

```json
{
  "skills": [
    { "id": "550e8400-e29b-41d4-a716-446655440001", "slug": "pitch-investor", "name": "Pitch investor", "category": "business" },
    ...
  ],
  "mentors": [
    {
      "user_id": "660e8400-...",
      "slug": "marie-dupont",
      "display_name": "Marie Dupont",
      "headline": "...",
      "primary_skill_ids": ["550e8400-..."]
    },
    ...
  ],
  "classes": [
    {
      "id": "770e8400-...",
      "mentor_user_id": "660e8400-...",
      "title": "Pitcher pour lever 500k",
      "skills_taught": ["550e8400-..."],
      ...
    },
    ...
  ],
  "sessions": [
    {
      "id": "880e8400-...",
      "class_id": "770e8400-...",
      "starts_at": "2026-07-15T09:00:00Z",
      "location_city": "Barcelona",
      "location_lat": 41.3851,
      "location_lng": 2.1734,
      ...
    },
    ...
  ]
}
```

### Règles

- **Tous les scripts de seed** des 4 Supabase consomment ce fichier (les UUIDs des skills, mentors, classes, sessions sont identiques partout)
- **Les nomads test** (`nomad1@hackathon.test`…) ont aussi leur user_id partagé pour cohérence Group C ↔ Group D
- Les entités **owned par un groupe** (ex : `mentor_application` côté A, `mira_class_module` côté B) ont leurs UUIDs générés au runtime de leur Supabase respective
- Les **seeds read views** d'un groupe (ex : `class_directory` côté C, `student_class_view` côté D) utilisent les UUIDs du fichier partagé

### Conséquence

Le storytelling jury fonctionne :
- "Antoine est candidat dans Group A" → user_id `660e8400-...`
- "Antoine apparaît dans `mentor_directory` de Group C" → même user_id `660e8400-...`
- "Anna est inscrite à la class d'Antoine" → enrolment lié au mentor_user_id `660e8400-...` (cohérent partout)

Sans ce fichier de référence, les démos cross-groupes seraient cassées.

## Limites hackathon — sync cross-groupes

Comme les 4 groupes ont des Supabase isolées, **certains triggers documentés ne peuvent pas fonctionner pendant le hackathon**. Les tableaux ci-dessous listent ce qui marche et ce qui est seedé.

### ✅ Triggers intra-groupe (fonctionnent en hackathon)

| Trigger | Groupe | Mécanisme |
|---|---|---|
| `mentor_application.validated` → crée `mentor_profile` | A → A | Service Group A, en intra-Supabase |
| `mentor_application.validated` → `mira_class.status='submitted' → 'validated_draft'` | A → A | Service Group A, en intra-Supabase |
| `mira_class_session.completed` → trigger reviews mentor | B (intra) | Service Group B |
| `mira_class_module_quiz` publié → visible apprenant (read seed côté D) | B → D | Seed coordonné via shared-seed-ids.json |
| `student_quiz_attempt.passed=TRUE` → update local skill validé | D (intra) | Service Group D, dans sa Supabase |
| `student_learning_path` regen suite update target_skills | C (intra) | Service Group C |

### ❌ Triggers cross-groupes (impossibles → seedés)

| Trigger documenté | Cross | Hackathon |
|---|---|---|
| `mira_class_enrolment.completed` → `student_skill.validated` (source=class_completion) | B → C | ❌ Seedé directement dans `student_skill` (Group C) avec `source='class_completion'` |
| `student_quiz_attempt.passed=TRUE` → `student_skill.validated` (source=quiz) | D → C | ❌ Seedé idem |
| `student_enrolment_intent.submitted` (Group C) → `mira_class_enrolment.applied` (Group B) | C → B | ❌ Group B a ses propres `mira_class_enrolment` seedés. Group C affiche son intent. **Pas de propagation réelle**. |
| `community_activity_feed` alimenté par events autres groupes | A/B/C → D | ❌ Seedé statiquement (déjà documenté) |
| `mira_class.status='validated'` (Group A) → seed Group B reçoit la class | A → B | ❌ Group B a son propre seed read de `mira_class` (issus du shared-seed-ids.json) |
| `skill_demand_aggregate` calculé depuis (target_skills C × mentors offering B) | C+B → A | ❌ Seedé statiquement avec valeurs réalistes |

### 🔵 Routes documentées V1 prod uniquement

Toutes les routes `/internal/*` ainsi que les transitions cross-services notées dans les sections "Reprenabilité" des contrats sont **V1 prod uniquement** — pas implémentées pendant le hackathon. Ce sont des cibles post-hackathon pour Claude Code.

### Conséquence pour la démo

La démo end-to-end est **cohérente visuellement** parce que tout est pré-seedé pour matcher le storytelling. L'apparence est celle d'un système réactif (Anna s'inscrit → Antoine voit la candidature). En réalité, les états initiaux sont cohérents au démarrage et chaque groupe simule son volet du flow indépendamment.

C'est **assumé** : l'objectif du hackathon est de livrer 4 codebases reprenables, pas de simuler un vrai système distribué.

## Validation finale

Tous les fichiers de contrat doivent être lus + validés par Lorenzo (CTO) **avant J0** pour garantir l'alignement backbone Hello Mira. Toute déviation requiert update explicite ici.
