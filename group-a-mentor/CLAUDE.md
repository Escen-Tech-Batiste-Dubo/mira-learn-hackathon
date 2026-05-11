# CLAUDE.md — Groupe A — Mentors

> Contexte automatiquement chargé par Claude Code / Cursor dans ce dossier. Lis aussi le [`CLAUDE.md` racine](../CLAUDE.md) pour les règles globales et [`BRIEF.md`](./BRIEF.md) pour le scope fonctionnel.

## Mission du groupe

Construire la **porte d'entrée côté offre** de Mira Learn :
- **Front public mentor** : landing recrutement (`/mentors`) + fiche détail (`/mentors/{slug}`)
- **Tunnel candidature en 8 étapes** (`/mentors/apply/step-{1..7}` + `/me/application`) avec assistant IA qui suggère des classes
- **Backoffice admin** : modération des candidatures (`/admin/applications`)

Persona connecté pour la démo : **Antoine Martin** (mentor déjà validé, star), **Emma Rossi** (candidate `submitted` à valider en live).

## Stack

- Backend : `backend/` — FastAPI 0.115 + alembic + JSend
- Web : `web/` — Next.js 16 + Tailwind v4 + shadcn/ui + Supabase
- DB : Postgres 16 local via `docker-compose.yml` (port 5432)

## Contrats à respecter

Source de vérité : [`../contracts/group-a-mentor/`](../contracts/group-a-mentor/) + [`../contracts/shared/skill.md`](../contracts/shared/skill.md).

### Tables possédées (write) par le Groupe A

| Entité | Description |
|---|---|
| `skill` | Catalogue de skills (write : seed initial uniquement, après lecture seule) |
| `mentor_application` | Candidature mentor — state machine `draft → submitted → in_review → validated → rejected` |
| `mentor_application_skill` | Skills proposées dans la candidature |
| `mentor_cv_import` | Trace d'un import CV/LinkedIn (avec parsing IA) |
| `mentor_profile` | Fiche publique mentor créée à validation candidature |
| `mentor_profile_skill` | Skills affichées sur la fiche mentor |
| `mentor_rating_breakdown` | Détail rating par sous-axe (lecture seule en hackathon) |
| `mira_class` | Coquille de class proposée pendant candidature — passe en `validated_draft` après admin |
| `mira_class_ai_suggestion` | Suggestions IA au candidat (croisement skill × demande × offre) |
| `mira_class_module_outline` | Pré-structure modules de la class proposée |
| `skill_demand_aggregate` | Vue agrégée demande apprenants × offre mentor (lecture seule) |

### Règles immuables sur les contrats

⚠️ **Les schémas SQL livrés sont figés.** Les migrations `0001_group_a_mentor_schema.py` et `0002_group_a_mentor_seed_demo.py` sont **déjà appliquées** et **ne doivent pas être modifiées**. Pour évoluer le schéma : créer une migration `0003_*.py`.

Champs critiques à respecter dans `mentor_application` :
- État via `status` (CHECK constraint) — pas de status custom
- Identité : `first_name`, `last_name`, `nomad_since_year`, `prior_masterclasses_count` — saisis à l'étape 1 et **verrouillés** après submit
- Workflow : `submitted_at` set quand `status → submitted`, `reviewed_at` set quand admin décide

Champs critiques `mira_class` (à respecter, surtout après l'étape 5-6 du tunnel) :
- `total_hours_collective` + `total_hours_individual` (granularité — pas juste `total_hours`)
- `rythm_pattern` (CHECK : `weekly_session | biweekly_session | monthly_workshop | intensive_weekend | self_paced`)
- `target_cities` (JSONB array de `{name, country_code}`)
- `recommended_price_per_hour_collective_cents` + `recommended_price_per_hour_individual_cents` (BIGINT — la simu de revenu est **calculée à la volée**, **pas stockée**)

## Patterns courants

### Ajouter un endpoint FastAPI

```python
# app/api/mentor_applications.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_session
from app.core.responses import jsend_success
from app.schemas.mentor_application import MentorApplicationCreate, MentorApplicationRead
from app.models.mentor_application import MentorApplication

router = APIRouter(prefix="/v1/mentor-applications", tags=["mentor-applications"])

@router.post("", response_model=dict)
async def create_application(
    body: MentorApplicationCreate,
    user: AuthenticatedUser = Depends(require_role("nomad")),
    db: AsyncSession = Depends(get_session),
):
    app = MentorApplication(user_id=user.user_id, status="draft", **body.model_dump())
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return jsend_success(MentorApplicationRead.model_validate(app).model_dump())
```

Pattern : modèle SQLAlchemy dans `app/models/`, schema Pydantic dans `app/schemas/`, route dans `app/api/`, enregistrement du router dans `main.py`.

### Ajouter une page Next.js

Routes côté front : `web/app/mentors/page.tsx` (annuaire), `web/app/mentors/[slug]/page.tsx` (fiche), `web/app/mentors/apply/step-{N}/page.tsx` (tunnel). Utiliser les composants atomiques du `design/template/` comme référence (`MentorsDirectory.jsx`, `MentorsApply.jsx`, etc.).

Pour les routes auth : utiliser le pattern de `web/app/(authenticated)/me/page.tsx` (Layout qui check `useAuth`).

### Migration Alembic 0003+

```bash
cd backend
source .venv/bin/activate
alembic revision -m "add_X_column_to_mentor_profile"
# Édite la migration générée dans alembic/versions/
alembic upgrade head
```

**Règle** : ne touche jamais aux 0001 / 0002 livrées. Pour annuler en local : `alembic downgrade -1` puis re-upgrade.

## Comment intégrer le proto Claude Design

Le proto live dans `design/template/` (composants React générés) est une **référence visuelle**, pas le code final. Pour le porter vers `web/` :

- Copier les **atoms** de `design/template/components/shared.jsx` → `web/components/ui/` (Avatar, Chip, Logo, Nav, Footer, etc.)
- Convertir chaque écran `.jsx` en page Next.js Server/Client Component :
  - `MentorsDirectory.jsx` → `web/app/mentors/page.tsx` (SSR avec `fetch /v1/mentors`)
  - `MentorDetail.jsx` → `web/app/mentors/[slug]/page.tsx` (SSR)
  - `MentorsApply.jsx` → 7 pages step `web/app/mentors/apply/step-{N}/page.tsx` (Client Components avec persistance auto-save backend)
  - `MyApplication.jsx` → `web/app/me/application/page.tsx`
  - `AdminApplications.jsx` + `AdminApplicationDetail.jsx` → `web/app/admin/applications/...`
  - `MiraAI.jsx` → `web/components/mira-ai/` (panneau suggestions + coach sidebar)
- Remplacer les imports `data.jsx` (mocks) par des fetchs API réels (cf. patterns FastAPI)

## Migration post-hackathon

Ton code passera vers le backbone Hello Mira (référence : [`../template/MIGRATION_GUIDE.md`](../template/MIGRATION_GUIDE.md)) :
- `mentor_profile` + `mentor_profile_skill` → `mentors-api` (extension service existant)
- `mentor_application` → `mentors-api.mentor_application`
- `mira_class` + `mira_class_module_outline` → `classes-api.mira_class`
- `mira_class_ai_suggestion` → log audit dans `bots-api` ou `mentors-api`
- `skill_demand_aggregate` → vue matérialisée nightly

→ Garde les noms de tables et colonnes alignés sur le contract pour faciliter le port.

## Ne fais PAS

- Ne hardcode pas d'URL Supabase / OpenRouter (`.env` only)
- Ne change pas la state machine `mentor_application.status` (CHECK SQL stricte)
- Ne crée pas un 2e composant `Avatar` ou `Chip` — réutilise ceux du template
- Ne modifie pas la state machine `mira_class.status`
- Ne touche pas aux contrats des groupes B/C/D (`mira_class` est cross-group, on le **lit** côté A après l'avoir créé en `validated_draft`)

## Test rapide après chaque tâche

```bash
# Backend : check que le serveur démarre + health
curl http://localhost:8000/v1/health

# Backend : check que la table existe
docker exec pg-hackathon-group-a psql -U postgres -c "\d mentor_application"

# Front : check que le build passe
cd web && npm run build
```
