# CLAUDE.md — Groupe B — Class

> Contexte automatiquement chargé par Claude Code / Cursor. Lis aussi le [`CLAUDE.md` racine](../CLAUDE.md) pour les règles globales et [`BRIEF.md`](./BRIEF.md) pour le scope fonctionnel.

## Mission du groupe

Construire le **backoffice mentor** où un Mira Mentor opère sa class de bout en bout :
- Création + édition de Mira Class
- Modules pédagogiques (drag/drop, matériel attaché)
- Sessions concrètes (dates, lieu, capacité, waitlist)
- QCM avec génération IA
- Forms personnalisés mentor (questions pré-inscription apprenant)
- Gestion candidatures apprenants (accept / refuse / waitlist)

Persona connecté pour la démo : **Antoine Martin** (mentor opère sa class "Pitcher pour lever 500k €" en `validated_draft` → `published`).

## Stack

- Backend : `backend/` — FastAPI + alembic + JSend
- Web : `web/` — Next.js 16 + Tailwind v4 + shadcn/ui + Supabase
- DB : Postgres 16 local via `docker-compose.yml` (port 5432)

## Contrats à respecter

Source de vérité : [`../contracts/group-b-class/`](../contracts/group-b-class/) + [`../contracts/shared/skill.md`](../contracts/shared/skill.md).

### Tables possédées (write) par le Groupe B

| Entité | Description |
|---|---|
| `mira_class_module` | Module pédagogique au sein d'une class (position, durée, type) |
| `mira_class_module_skill` | Skills validées en complétant le module |
| `mira_class_session` | Instance datée d'une class (lieu + capacité + waitlist) |
| `mira_class_session_module` | Programmation d'un module dans une session (date, salle, lien Zoom) |
| `mira_class_session_module_material` | Matériel attaché (PDF, vidéo, URL) à un module d'une session |
| `mira_class_module_quiz` | QCM associé à un module |
| `mira_class_module_quiz_question` | Question d'un QCM |
| `mira_class_module_quiz_option` | Option de réponse d'une question |
| `mira_class_enrolment` | Candidature d'un apprenant à une session |

### Tables cross-group (lecture seule pour vous)

| Entité | Source | Comment l'utiliser |
|---|---|---|
| `mira_class` | Groupe A | Lis-la pour afficher les classes du mentor. Tu peux passer `status` de `validated_draft` → `enrichment_in_progress` → `published`, et toucher `published_at`. |
| `mentor_profile` | Groupe A | Lis pour afficher le mentor connecté |

### Règles immuables

⚠️ **Les schémas SQL sont figés.** Les migrations `0001_group_b_class_schema.py` + `0002_group_b_class_seed_demo.py` sont **déjà appliquées**. Pour évoluer : migration `0003+`.

CHECK constraints à respecter :
- `mira_class_module.type` IN (`theory | practice | exercise | discussion | workshop`)
- `mira_class_module.status` IN (`draft | published | archived`)
- `mira_class_session.type` IN (`physical | virtual | hybrid`) — avec CHECK sur location_address selon le type
- `mira_class_session.status` IN (`planned | open_enrolment | full | in_progress | completed | cancelled`)
- `mira_class_session.capacity` BETWEEN 1 AND 50
- `mira_class_enrolment.status` IN (`applied | waitlist | accepted | rejected | cancelled | completed`)
- `mira_class_module_quiz.status` IN (`draft | published | archived`)

Compteurs dénormalisés à maintenir cohérents :
- `mira_class_session.enrolment_count` ← nombre d'enrolments status=`accepted`
- `mira_class_session.waitlist_count` ← nombre d'enrolments status=`waitlist`

## Workflow class — state machine

```
draft → submitted → in_review → validated_draft  (Group A vous livre la class à ce stade)
                                       ↓
                                       enrichment_in_progress  (vous enrichissez : modules + matériel + sessions + QCM)
                                       ↓
                                       published  (publication par le mentor)
                                       ↓
                                       archived  (fin de vie)
```

Le passage `validated_draft → enrichment_in_progress` se fait quand le mentor ajoute le 1er module. Le passage `enrichment_in_progress → published` est explicite via bouton "Publier" (validations : au moins 1 module + au moins 1 session + au moins 1 QCM publié).

## Patterns courants

### Ajouter un endpoint FastAPI

```python
# app/api/modules.py
@router.post("/v1/classes/{class_id}/modules", response_model=dict)
async def create_module(
    class_id: str,
    body: MiraClassModuleCreate,
    user: AuthenticatedUser = Depends(require_role("mentor")),
    db: AsyncSession = Depends(get_session),
):
    # 1. Vérifie que la class appartient bien au mentor connecté
    cls = await db.get(MiraClass, class_id)
    if not cls or cls.mentor_user_id != user.user_id:
        raise HTTPException(404)
    # 2. Crée le module
    module = MiraClassModule(class_id=class_id, **body.model_dump())
    db.add(module)
    # 3. Bascule la class en enrichment_in_progress si encore validated_draft
    if cls.status == "validated_draft":
        cls.status = "enrichment_in_progress"
    await db.commit()
    return jsend_success(MiraClassModuleRead.model_validate(module).model_dump())
```

### Génération QCM via OpenRouter

Pattern dans `app/integrations/openrouter.py` :

```python
from app.integrations.openrouter import LLMClient

prompt = f"""Génère {n_questions} questions de QCM pour le module suivant.
Module : {module.title}
Description : {module.description}
Réponds au format JSON : {{"questions": [{{"text": "...", "options": [...], "correct_index": 0, "explanation": "..."}}]}}
"""
result = await LLMClient.complete(prompt, model="anthropic/claude-3.5-haiku")
# Parse JSON, valide via Pydantic, insère en DB en `draft`
```

### Migration Alembic 0003+

```bash
cd backend
source .venv/bin/activate
alembic revision -m "add_recording_url_to_session_module"
# Édite la migration générée dans alembic/versions/
alembic upgrade head
```

## Composants design

Source : `design/template/src/screens/` contient les écrans React du proto Claude Design. À porter dans `web/app/dashboard/...`.

- `Dashboard.jsx` → `web/app/dashboard/page.tsx`
- `Classes.jsx` → `web/app/dashboard/classes/page.tsx`
- `ClassEdit.jsx` (4 tabs) → `web/app/dashboard/classes/[id]/page.tsx` + sous-routes ou query string
- `Sessions.jsx` → `web/app/dashboard/sessions/page.tsx` (vue agrégée — **toutes** les sessions du mentor)
- `Learners.jsx` → `web/app/dashboard/learners/page.tsx` (vue CRM — **tous** les apprenants du mentor) + drawer side-panel
- `QuizEditor.jsx` → `web/app/dashboard/quizzes/[id]/page.tsx`

⚠️ **Manques connus du proto** (à coder pendant le hackathon — voir `design/template-overview.md` section "Limites") :
1. Forms personnalisés mentor (UI builder de questions pré-inscription)
2. Matériel module détaillé (upload PDF / vidéo URL)
3. Création QCM depuis un module (route `/dashboard/modules/{id}/quizzes/new`)
4. Workflow `enrichment_in_progress` plus détaillé que le simple bouton `Soumettre à validation admin`

## Migration post-hackathon

Référence : [`../template/MIGRATION_GUIDE.md`](../template/MIGRATION_GUIDE.md).

Tes tables migreront vers :
- `mira_class_module` + variantes → `classes-api.mira_class_module*`
- `mira_class_session` + variantes → `classes-api.mira_class_session*`
- `mira_class_enrolment` → `classes-api.mira_class_enrolment` (avec NATS events `class.enrolment.applied` / `accepted` etc.)
- `mira_class_module_quiz` + variantes → `classes-api.mira_class_quiz*`

## Ne fais PAS

- Ne touche pas aux contrats du Groupe A (`mira_class.id`, `mentor_user_id`, `application_id`)
- Ne crée pas de duplication de skill (`skill` est dans `shared/`, lecture seule pour B)
- Ne mets pas les `capacity` à plus de 50 (CHECK SQL stricte)
- Ne stocke pas les statistiques de revenue (calcule à la volée — pattern du contract mira_class)

## Test rapide après chaque tâche

```bash
# Backend : check health + version
curl http://localhost:8000/v1/health

# Backend : compte les modules d'une class
docker exec pg-hackathon-group-b psql -U postgres -c "SELECT class_id, count(*) FROM mira_class_module GROUP BY class_id;"

# Front : check le build
cd web && npm run build
```
