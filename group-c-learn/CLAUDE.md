# CLAUDE.md — Groupe C — Learn

> Contexte automatiquement chargé par Claude Code / Cursor. Lis aussi le [`CLAUDE.md` racine](../CLAUDE.md) pour les règles globales et [`BRIEF.md`](./BRIEF.md) pour le scope fonctionnel.

## Mission du groupe

Construire le **front public apprenant** de Mira Learn — c'est le visage marketing premium qui transforme un visiteur en candidat à une class :
- Landing chaleureux (`/`)
- Catalogue Mira Class (`/classes`) + détail (`/classes/{slug}`)
- Profil apprenant (`/me`) : skills cibles + visibilité + bio
- **Génération parcours d'apprentissage IA** (`/me/path/generate` → `/me/path`) — wow feature
- Form intent d'inscription (`/classes/{slug}/apply`)
- Carte communauté (`/community`)

Persona connectée pour la démo : **Anna Lopez** (designer en transition vers le SaaS, cibles : Pitch investor + Funding strategy → recommandation class Antoine).

## Stack

- Backend : `backend/` — FastAPI + alembic + JSend
- Web : `web/` — Next.js 16 + Tailwind v4 + shadcn/ui + Supabase
- DB : Postgres 16 local via `docker-compose.yml` (port 5432)

## Contrats à respecter

Source de vérité : [`../contracts/group-c-learn/`](../contracts/group-c-learn/) + [`../contracts/shared/skill.md`](../contracts/shared/skill.md).

### Tables possédées (write) par le Groupe C

| Entité | Description |
|---|---|
| `student_profile` | Profil apprenant (display_name, headline, country, visibility, languages) |
| `student_skill` | Skills cibles déclarées par l'apprenant + skills validées |
| `student_cv_import` | Trace d'un import CV (parsing IA pour identifier skills déjà acquises) |
| `student_learning_path` | Parcours actif généré par IA (target_skills + status) |
| `student_learning_path_step` | Étape du parcours (skill_id + class recommandée + rationale + status) |
| `student_path_regeneration_log` | Audit des régénérations de parcours |
| `student_enrolment_intent` | Form pré-inscription (avant que ça devienne une `mira_class_enrolment`) |
| `skill_relation` | Relations entre skills (prerequisite, related) — utile pour la génération de parcours |

### Tables cross-group (lecture seule pour vous)

| Entité | Source | Usage |
|---|---|---|
| `skill` | shared | Catalogue lu en permanence (chips, recommandations) |
| `mira_class` | Groupe A | Lis-la pour afficher le catalogue + détail |
| `mentor_profile` | Groupe A | Lis pour afficher le mentor d'une class |

### Règles immuables

⚠️ **Les schémas SQL sont figés.** Les migrations `0001_*` et `0002_*` sont déjà appliquées. Pour évoluer : `0003+`.

CHECK constraints à respecter :
- `student_profile.visibility` IN (`public | private`)
- `student_profile.learning_horizon` IS NULL OR IN (`3_months | 6_months | 1_year`)
- `student_skill.status` IN (`target | acquired | validated`) — `target` = déclaré ; `validated` = passé un QCM côté mobile
- `student_skill.source` IN (`self_declared | cv_import | quiz_passed`)
- `student_learning_path.status` IN (`active | completed | archived`)
- `student_learning_path_step.status` IN (`locked | in_progress | completed`)
- `student_enrolment_intent.status` IN (`pending | submitted | dropped`)

## Patterns courants

### Ajouter un endpoint FastAPI

```python
# app/api/me.py
@router.get("/v1/me/path", response_model=dict)
async def get_my_path(
    user: AuthenticatedUser = Depends(require_role("nomad")),
    db: AsyncSession = Depends(get_session),
):
    profile = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user.user_id)
    )
    profile = profile.scalar_one_or_none()
    if not profile:
        raise HTTPException(404, "Profile not found")

    path = await db.execute(
        select(StudentLearningPath)
        .where(StudentLearningPath.profile_id == profile.id, StudentLearningPath.status == "active")
    )
    path = path.scalar_one_or_none()
    if not path:
        return jsend_success(None, message="No active path")

    steps = await db.execute(
        select(StudentLearningPathStep)
        .where(StudentLearningPathStep.path_id == path.id)
        .order_by(StudentLearningPathStep.position)
    )
    return jsend_success({
        "path": StudentLearningPathRead.model_validate(path).model_dump(),
        "steps": [StudentLearningPathStepRead.model_validate(s).model_dump() for s in steps.scalars()],
    })
```

### Génération parcours via OpenRouter

C'est **la feature signature** du Groupe C. Pattern :

```python
# app/services/path_generator.py
from app.integrations.openrouter import LLMClient

async def generate_path(profile: StudentProfile, target_skills: list[str]) -> list[dict]:
    """
    Croise les target_skills × skill_relations × mira_class published × profil
    pour produire un parcours en N étapes (3-5 typiquement).
    """
    # 1. Charger les skill_relations pour identifier les prerequisites
    # 2. Charger les mira_class published qui couvrent les target_skills
    # 3. Prompt OpenRouter avec contexte structuré

    prompt = f"""Tu génères un parcours d'apprentissage personnalisé pour un nomade.

Profil :
- Country : {profile.current_country}
- Languages : {profile.languages}
- Bio : {profile.bio or '(none)'}

Skills cibles : {target_skills}

Classes Mira disponibles :
{available_classes_json}

Skill relations (prerequisites) :
{skill_relations_json}

Génère un parcours en 3-5 étapes au format JSON :
{{"steps": [{{"skill_id": "...", "recommended_class_id": "...", "rationale": "...", "estimated_weeks": N}}, ...]}}
"""
    result = await LLMClient.complete(prompt, model="anthropic/claude-3.5-haiku")
    # Parse JSON, valide via Pydantic, insère en DB
```

⚠️ Budget OpenRouter cap **$5**. La génération de parcours coûte ~$0.02 par appel. Évite les boucles d'agent qui spamment.

## Composants design

Source : `design/template/src/pages/`. À porter dans `web/app/`.

| Page proto | Page Next.js |
|---|---|
| `Landing.jsx` | `web/app/page.tsx` (Server Component, SEO friendly) |
| `Catalogue.jsx` | `web/app/classes/page.tsx` (Server Component + filtres en query string) |
| `ClassDetail.jsx` | `web/app/classes/[slug]/page.tsx` (Server Component, SSR) |
| `Me.jsx` | `web/app/me/page.tsx` (Client Component, édition inline) |
| `PathGenerate.jsx` | `web/app/me/path/generate/page.tsx` (Client Component, loader long) |
| `Path.jsx` | `web/app/me/path/page.tsx` (Server + Client mixed) |
| `Apply.jsx` | `web/app/classes/[slug]/apply/page.tsx` (Client Component, form) |
| `Community.jsx` | `web/app/community/page.tsx` (Server Component) |

Le proto a un **panneau de tweaks** (`personaState` / `pathStyle` / `accentIntensity`) pour switcher entre états démo — à supprimer en prod.

## Migration post-hackathon

Référence : [`../template/MIGRATION_GUIDE.md`](../template/MIGRATION_GUIDE.md).

Tes tables migreront vers :
- `student_profile` + `student_skill` → `users-api` extension (table `learner_profile` + `learner_skill`)
- `student_learning_path` + `student_learning_path_step` → service dédié `learn-path-api` ou extension `users-api`
- `student_cv_import` → `analyzers-api` (déjà existant pour KYC OCR)
- `student_enrolment_intent` → `classes-api.enrolment_intent` (pré-enrolment)

## Ne fais PAS

- Ne modifie pas `mira_class` (write côté A/B, **lecture seule** pour C)
- Ne crée pas de table `learner` à part — utilise `student_profile`
- Ne stocke pas un parcours actif **et** un parcours archivé en même temps actif (status unique = `active`)
- Ne hardcode pas le path "3 mois / 6 mois / 1 an" — c'est une CHECK constraint
- Ne crée pas le `enrolment` côté C — c'est `student_enrolment_intent` (pré-stage) puis traduit en `mira_class_enrolment` côté B

## Test rapide après chaque tâche

```bash
# Backend : check health
curl http://localhost:8000/v1/health

# DB : voir le parcours d'Anna
docker exec pg-hackathon-group-c psql -U postgres -c "SELECT * FROM student_learning_path WHERE profile_id IN (SELECT id FROM student_profile WHERE display_name = 'Anna Lopez');"

# Front : check le build SSR
cd web && npm run build
```
