# MIGRATION_GUIDE — Hackathon template → Hello Mira backbone

Guide détaillé pour Claude Code (ou un humain) qui doit migrer le code d'un groupe hackathon vers notre stack Hello Mira backbone post-hackathon.

> Ce guide est **lu par Claude Code** au moment du sprint de reprise. Il est volontairement explicite avec exemples avant/après.

---

## Vue d'ensemble

Le template FastAPI hackathon est **structuré pour être migrable mécaniquement**. Chaque morceau de "boilerplate" présent dans le template correspond à une primitive Hello Mira existante (UnifiedModel, BaseMicroservice, integrations-api, etc.). La migration consiste essentiellement à :

1. Remplacer les imports custom par les imports `ms-common-api`
2. Reconfigurer auth via edge-gateway (suppression du custom JWT decode)
3. Remplacer les appels OpenRouter par HMAC vers `bots-api` / `integrations-api`
4. Ajouter NATS publishers/consumers selon les events documentés dans les contrats
5. Adapter le déploiement (Docker + K8s OVHCloud + GitHub Actions)

---

## Sections de migration

### 1. Base SQLAlchemy → UnifiedModel

**Avant (template hackathon)** :
```python
# app/models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime
from datetime import datetime
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(...)
    updated_at: Mapped[datetime] = mapped_column(...)

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(...)

# app/models/mira_class.py
class MiraClass(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "mira_class"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200))
    ...
```

**Après (backbone Hello Mira)** :
```python
# app/models/mira_class.py
from ms_common_api.models import UnifiedModel

class MiraClass(UnifiedModel):
    """UnifiedModel apporte automatiquement :
    - id (UUID v4) + _id (Mongo compat)
    - created_at / updated_at / deleted_at + triggers
    - JSend serialization helpers
    - NATS event emission hooks (emit_created, emit_updated, emit_deleted)
    - Validation pydantic intégrée
    """
    __tablename__ = "mira_class"
    title: str  # type hint Python suffit avec UnifiedModel
    ...
```

**Transformations à appliquer** :
- `Base, TimestampMixin, SoftDeleteMixin` → `UnifiedModel`
- Champs `id`, `created_at`, `updated_at`, `deleted_at` : à retirer (auto par UnifiedModel)
- Imports : `from ms_common_api.models import UnifiedModel`
- Types : type hints Python natifs au lieu de `Mapped[type]` (selon convention UnifiedModel)
- Migration Alembic : déjà compatible (même schéma DB)

---

### 2. Auth custom JWT → edge-gateway scopes

**Avant (template hackathon)** :
```python
# app/core/auth.py
import jwt
from fastapi import Header, HTTPException
from app.core.config import settings

async def require_auth(authorization: str = Header(...)) -> dict:
    """Decode + validate Supabase JWT via JWKS."""
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(
        token,
        key=fetch_supabase_jwks(),
        algorithms=["RS256"],
        audience="authenticated",
    )
    return {
        "user_id": payload["sub"],
        "email": payload["email"],
        "role": payload.get("user_metadata", {}).get("role", "nomad"),
    }

def require_role(role: str):
    async def _check(user = Depends(require_auth)):
        if user["role"] != role:
            raise HTTPException(403)
        return user
    return _check

# app/api/v1/endpoints/mira_class.py
@router.post("/classes")
async def create_class(
    body: MiraClassCreate,
    user = Depends(require_role("mentor")),
):
    ...
```

**Après (backbone Hello Mira)** :
```python
# app/api/v1/endpoints/mira_class.py
from ms_common_api.auth import require_scope, current_user

@router.post("/classes")
async def create_class(
    body: MiraClassCreate,
    user: User = Depends(current_user),  # injecté par edge-gateway via headers
    _: None = Depends(require_scope("classes:write:own")),
):
    ...
```

**Transformations** :
- Edge-gateway upstream valide le JWT et injecte les headers :
  - `X-User-Id`
  - `X-User-Email`
  - `X-Computed-Scopes` (CSV des scopes calculés depuis user_metadata + app installations)
- Le service backbone reçoit déjà les headers (pas de JWT à valider localement)
- Le pattern `require_role(...)` devient `require_scope(...)` avec scopes Hello Mira (`mentors:write:own`, `classes:read:public`, etc.)
- Suppression complète de `app/core/auth.py` (remplacé par `ms-common-api.auth`)
- Suppression de la dépendance `pyjwt` + JWKS fetch

**Scopes Hello Mira pour Mira Learn** (à ajouter au catalogue scopes backbone) :
```
mentors:write:own          # mentor édite son profil/candidature
mentors:read:public        # lecture annuaire public
classes:write:own          # mentor édite ses classes
classes:read:public        # lecture catalogue public
classes:write:admin        # admin valide candidatures + classes
learn:read:own             # nomad consulte son parcours
learn:write:own            # nomad valide skills, soumet quiz
rates:write:own            # post-class review
```

---

### 3. Intégrations LLM : OpenRouter → bots-api / integrations-api

**Avant (template hackathon)** :
```python
# app/integrations/openrouter.py
import httpx
from app.core.config import settings

class LLMClient:
    BASE_URL = "https://openrouter.ai/api/v1"

    async def complete(self, messages, model="anthropic/claude-3.5-sonnet", **kwargs):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"},
                json={"messages": messages, "model": model, **kwargs},
            )
            return response.json()

    async def extract_skills_from_cv(self, cv_text: str) -> list[dict]:
        ...
```

**Après (backbone Hello Mira)** :

Deux options selon le use case :

**Option A** — Le call est une **opération IA conversationnelle ou avec tool calling** → passer par `bots-api` :
```python
# app/clients/bots_client.py
from ms_common_api.clients import internal_service_client

async def call_tutor_bot(class_id: str, message: str, history: list[dict]) -> dict:
    response = await internal_service_client.call(
        service="bots-api",
        method="POST",
        path=f"/internal/bots/mira-class-tutor-{class_id}/respond",
        data={
            "message": message,
            "history": history,
        },
    )
    return response["data"]
```

`bots-api` gère :
- Sélection du LLM (Claude/OpenAI/Gemini) selon la config du bot
- Boucle tool-calling (max 10 itérations)
- Prompt assembly (hello_mira + bot_context + mission + tools + rules)
- Audit log + cost tracking
- Cache embeddings (situations, RAG)
- Streaming via NATS si besoin (`chat.message.streaming`)

**Option B** — Le call est une **opération IA technique unique** (extraction structurée, transcription, etc.) → passer par `integrations-api` :
```python
# app/clients/integrations_client.py
from ms_common_api.clients import internal_service_client

async def extract_skills_from_cv(cv_text: str) -> list[dict]:
    response = await internal_service_client.call(
        service="integrations-api",
        method="POST",
        path="/internal/integrations/openai/extract_skills",
        data={
            "cv_text": cv_text,
            "schema": SKILL_EXTRACTION_SCHEMA,
        },
    )
    return response["data"]["skills"]
```

`integrations-api` gère :
- Abstraction provider (OpenAI/Anthropic/Mistral selon route)
- Rate limiting par tenant
- Retry exponentiel
- Fallback automatique
- Audit coût par appel

**Transformations** :
- Supprimer `app/integrations/openrouter.py`
- Créer `app/clients/bots_client.py` ET/OU `app/clients/integrations_client.py`
- Identifier pour chaque use case : Option A (conversationnel) ou Option B (one-shot structuré)
- Pour Mira Learn :
  - **AI Tutor** (Group D) → bots-api (bot `mira-class-tutor-{class_id}`)
  - **Génération QCM** (Group B) → bots-api OU integrations-api selon ampleur
  - **Suggestion modules class** (Group B) → integrations-api (one-shot structuré)
  - **Extraction skills CV** (Group A + C) → integrations-api (one-shot)
  - **Génération parcours apprenant** (Group C) → integrations-api (one-shot avec structured output)
  - **Organisation notes IA** (Group D) → integrations-api (one-shot)

---

### 4. JSend responses

**Avant (template hackathon)** :
```python
# app/core/responses.py
from typing import Any

def success_response(data: Any = None, message: str | None = None) -> dict:
    return {"status": "success", "data": data, "message": message}

def fail_response(data: Any, message: str | None = None) -> dict:
    return {"status": "fail", "data": data, "message": message}

def error_response(message: str, data: Any = None) -> dict:
    return {"status": "error", "data": data, "message": message}
```

**Après (backbone)** :
```python
from ms_common_api.responses import success_response, fail_response, error_response
```

**Transformations** :
- Supprimer `app/core/responses.py`
- Remplacer les imports : `from app.core.responses import ...` → `from ms_common_api.responses import ...`
- Format identique → aucune adaptation de signature
- Bonus ms-common-api : `request_id` automatique dans la réponse, locale-aware error messages

---

### 5. Configuration → BaseMicroservice

**Avant (template hackathon)** :
```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str
    OPENROUTER_API_KEY: str
    SERVICE_NAME: str = "my-service"
    BUILD_SHA: str = "dev"

    class Config:
        env_file = ".env"

settings = Settings()

# main.py
from fastapi import FastAPI
from app.api.v1 import router as v1_router

app = FastAPI(title="My Service")
app.include_router(v1_router.router)
```

**Après (backbone)** :
```python
# app/core/config.py
from ms_common_api.microservice import BaseMicroservice

microservice = BaseMicroservice(
    service_name="learn-api",
    enable_nats=True,
    enable_redis=False,
    enable_mongo=False,
    enable_postgresql=True,
)

# main.py
from app.core.config import microservice
from app.api.v1 import router as v1_router

app = microservice.app  # FastAPI app pré-configurée
app.include_router(v1_router.router)
```

`BaseMicroservice` configure automatiquement :
- FastAPI app avec middleware standard (CORS, structlog request_id propagation, Sentry, Prometheus)
- Routes auto `/health`, `/ready`, `/version` (build SHA + date)
- Lifespan NATS connect/disconnect
- Lifespan Redis connect/disconnect (si activé)
- Lifespan PostgreSQL session factory (si activé)
- Exception handlers JSend-aware
- Metrics endpoint `/metrics`
- Validation env vars au boot

**Transformations** :
- Remplacer `app/core/config.py` Settings → `BaseMicroservice` instance
- Supprimer `main.py` boilerplate FastAPI
- Garder uniquement `app.include_router(...)` dans `main.py`

---

### 6. Database session → ms-common-api

**Avant (template hackathon)** :
```python
# app/core/db.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, ...)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

**Après (backbone)** :
```python
# Import directement depuis ms-common-api
from ms_common_api.database import get_db, AsyncSessionLocal
```

`BaseMicroservice` initialise automatiquement la session factory au boot avec retry + connection pool tuning Hello Mira standard.

---

### 7. Logging → structlog

**Avant (template hackathon)** :
```python
# app/core/logging.py
import logging
logger = logging.getLogger(__name__)
logger.info("message", extra={"key": "value"})
```

**Après (backbone)** :
```python
import structlog
logger = structlog.get_logger(__name__)
logger.info("message", key="value", request_id=...)
```

**Transformations** :
- Remplacer `logging.getLogger` → `structlog.get_logger`
- Adapter syntaxe : `extra={"key": "value"}` → `key="value"`
- `exc_info=True` dans tous les `except` blocs (convention Hello Mira)
- Format JSON via orjson (auto avec ms-common-api)

---

### 8. NATS publishing/consuming (à ajouter)

Le template hackathon **n'a pas** de NATS — les groupes ne s'envoient pas d'events. Post-hackathon, il faut ajouter :

**Publisher (event emission)** :
```python
# Dans un service, à la fin d'une action métier
from ms_common_api.nats import publish

async def validate_application(application_id: str):
    # ... logique de validation ...
    await publish(
        subject="mentor.application.validated",
        payload={
            "application_id": application_id,
            "mentor_user_id": user_id,
            "validated_at": now.isoformat(),
        },
    )
```

**Consumer (event handling)** :
```python
# app/consumers/application_validated_consumer.py
from ms_common_api.nats import subscribe

@subscribe("mentor.application.validated", queue_group="learn-api-mentor-events")
async def handle_application_validated(payload: dict):
    # Réagir : créer learning_path par défaut, etc.
    ...
```

**Pour Mira Learn**, les events à ajouter (cf. contrats) :
- `mentor.application.submitted` / `mentor.application.validated`
- `class.class.submitted` / `class.class.validated` / `class.class.published`
- `class.session.published` / `class.session.started` / `class.session.completed` / `class.session.cancelled`
- `class.enrolment.applied` / `class.enrolment.accepted` / `class.enrolment.completed`
- `learn.skill.validated`
- `learn.path.generated` / `learn.path.completed`
- `forms.submission.scored` / `forms.submission.passed`
- `rate.rate.published`

Liste complète dans chaque fichier `contracts/{group}/{entity}.md` section "Reprenabilité".

---

## Ordre de migration recommandé

Pour un sprint de reprise par Claude Code (~5-7 j-pers post-hackathon) :

### Jour 1 — Audit + scaffolding services backbone
1. Lire les 4 codebases hackathon (Group A/B/C/D)
2. Cartographier les entités → services Hello Mira cibles (utilise les "Mapping" dans chaque contrat)
3. Créer les skeletons de services manquants :
   - `learn-api` (nouveau)
   - `forms-api` (nouveau)
   - Extensions `classes-api`, `mentors-api`, `users-api`, `community-api`
4. Décisions architecturales V1 (stream-api ? rates-api ? skills-api ?)

### Jour 2 — Migration entités + schémas
Pour chaque entité, dans cet ordre :
1. Migration Alembic dans le service cible (schéma déjà aligné)
2. SQLAlchemy ORM avec `UnifiedModel`
3. Pydantic schemas (identiques au template)
4. Service métier (logique conservée)
5. Routes API (refactor scopes + JSend imports)

### Jour 3 — Auth + cross-services
1. Configurer scopes Hello Mira dans `apps-api`
2. Tester JWT validation via edge-gateway
3. Implémenter les HMAC clients vers autres services backbone
4. Remplacer LLMClient par bots-api / integrations-api

### Jour 4 — NATS events
1. Ajouter publishers à chaque transition d'état métier
2. Ajouter consumers cross-services (selon contrats)
3. Tester l'event flow end-to-end

### Jour 5 — Tests + déploiement
1. Tests d'intégration cross-services
2. Déploiement K8s OVHCloud
3. Smoke test en staging
4. Polish + observability (Sentry + Prometheus)

---

## Cas particuliers Mira Learn

### Cas 1 : `mira_class` partagé entre Group A et Group B

Pendant hackathon : 2 Supabase séparés avec leur propre `mira_class` (Group A write puis Group B read seed).

**Migration** : 1 seule table `classes-api.mira_class`, state machine unifié :
```
draft (A) → submitted (A) → in_review (admin) → validated_draft (A → B)
                                              → rejected (A)
validated_draft (B) → enrichment_in_progress (B) → published (B) → archived (B)
```

**Action** : Claude Code merge le code des routes Group A `/v1/mentors/applications/me/classes` + Group B `/v1/classes` en un seul service `classes-api`, avec dispatch par scope (`classes:write:own` du mentor, `classes:write:admin` de l'admin).

### Cas 2 : `student_enrolment_intent` (Group C) → `mira_class_enrolment` (Group B)

Pendant hackathon : 2 tables séparées (pas de propagation).

**Migration** : suppression de `student_enrolment_intent`. Le frontend Group C (devenu `mira-learn-web` section apprenant) appelle directement `POST /v1/sessions/{id}/enrolments` (classes-api) qui crée le `mira_class_enrolment` avec status='applied'. Le mentor (Group B → classes-api) le voit immédiatement.

**Action** : drop table, refactor frontend.

### Cas 3 : Quiz Group B (write) ↔ Group D (read seed + attempts/answers)

Pendant hackathon : Group B owns quiz tables, Group D les seed en read + ajoute `student_quiz_attempt`/`answer`.

**Migration** : tout devient `forms-api`. `mira_class_module_quiz` devient `forms-api.form` (type='quiz', owner_type='mira_class_module'). `student_quiz_attempt` devient `forms-api.form_submission`. `student_quiz_answer` devient `forms-api.answer`.

**Action** : créer `forms-api` from scratch (cf. PRD V3 vision Cédric), migrer les 5 tables (quiz + question + option + attempt + answer) avec renommages.

### Cas 4 : LLM use cases multiples

Pendant hackathon : tout passe par `LLMClient` OpenRouter.

**Migration** par use case :
| Use case (groupe) | Migration cible |
|---|---|
| CV extraction skills (A, C) | `integrations-api` (one-shot structured) |
| Coach IA candidature (A) | `bots-api` (bot conversationnel) |
| Suggestion classes IA — Skill Gap (A) | `integrations-api` (one-shot) |
| Suggestion modules class (B) | `integrations-api` (one-shot) |
| Génération QCM (B) | `integrations-api` (one-shot structured) |
| Génération parcours apprenant (C) | `integrations-api` (one-shot structured) |
| Organisation notes IA (D) | `integrations-api` (one-shot) |
| AI Tutor chat (D — feature future) | `bots-api` (bot `mira-class-tutor-{class_id}`) |

---

## Checklist finale de migration

Pour chaque codebase hackathon migrée :

- [ ] Tous les `MIGRATION HINT` du code source ont été adressés
- [ ] Aucun import depuis `app.core.auth` / `app.core.responses` / `app.core.db` / `app.models.base` (remplacé par ms-common-api)
- [ ] Aucun import depuis `app.integrations.openrouter` (remplacé par bots-api / integrations-api)
- [ ] Toutes les entités SQLAlchemy héritent de `UnifiedModel`
- [ ] Toutes les routes utilisent `require_scope(...)` avec scopes Hello Mira valides
- [ ] NATS publishers ajoutés sur toutes les transitions d'état métier
- [ ] NATS consumers ajoutés pour les events cross-services consommés
- [ ] Tests adaptés avec fixtures `ms-common-api`
- [ ] Dockerfile + K8s manifests créés (référence `backbone/services/*/k8s/`)
- [ ] GitHub Actions workflow `deploy-k8s.yml` ajouté
- [ ] Observability : Sentry init + Prometheus metrics + structlog config
- [ ] Documentation `CLAUDE.md` du service mise à jour

---

## Ressources

- Référence d'un service backbone : `backbone/services/auth-api/` ou `backbone/services/users-api/`
- Template officiel backbone : `backbone/ms-template-api/`
- ms-common-api : `backbone/ms-common-api/`
- Conventions backbone : `backbone/CLAUDE.md`
- Contrats hackathon : `hackathon/contracts/`
- Plan hackathon (organisation + livrables) : `docs/mira-documentation/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`
- PRD Mira Learn V3 : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`

---

> Modifié le 2026-05-11 par @FourmiCrobe — Création du guide de migration template hackathon → backbone Hello Mira.
