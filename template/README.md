# Template Hackathon — Backend FastAPI

Template canonique pour les backends FastAPI du hackathon. Chaque groupe **clone ce template**, le renomme, et l'utilise comme base de leur monolithe.

## Double objectif

Ce template a **deux finalités** :

1. **Démarrage rapide pour les étudiants** : un FastAPI vanilla fonctionnel, structuré, prêt à `make dev` en <5 minutes.
2. **Reprenabilité Claude Code post-hackathon** : chaque pattern qui sera remplacé par notre stack Hello Mira (UnifiedModel, integrations-api, edge-gateway scopes, etc.) est documenté via des commentaires `MIGRATION HINT` dans le code et un `MIGRATION_GUIDE.md` détaillé.

## Structure

```
template/
├── README.md                       # ce fichier
├── MIGRATION_GUIDE.md              # mapping détaillé hackathon → Hello Mira backbone
└── backend/                        # template FastAPI complet
    ├── README.md                   # setup + commandes dev
    ├── main.py                     # entrée FastAPI
    ├── alembic.ini
    ├── alembic/                    # migrations
    ├── app/
    │   ├── api/v1/                 # routes versionnées
    │   ├── core/                   # auth, config, db, responses, exceptions
    │   ├── models/                 # SQLAlchemy ORM (Base custom — sera UnifiedModel)
    │   ├── schemas/                # Pydantic request/response
    │   ├── services/               # logique métier
    │   └── integrations/           # APIs externes (OpenRouter — sera bots-api/integrations-api)
    ├── tests/                      # pytest async
    ├── requirements.txt
    ├── requirements-dev.txt
    ├── Makefile                    # make dev / make test / make migrate
    ├── .env.example
    └── pytest.ini
```

## Convention de migration

Toutes les conventions Hello Mira backbone qui ne sont **pas accessibles aux étudiants pendant le hackathon** sont remplacées dans ce template par des équivalents vanilla, avec des `MIGRATION HINT` documentés.

| Concept Hello Mira backbone | Équivalent template hackathon | Migration |
|---|---|---|
| `ms-common-api.UnifiedModel` | `app.models.base.Base` (SQLAlchemy DeclarativeBase custom) | Remplacement direct, schéma identique |
| `ms-common-api.BaseMicroservice` | `main.py` + `app.core` modules | Recomposition |
| Edge-gateway JWT validation + scope injection | `app.core.auth.require_auth/require_scope` (JWKS local) | Suppression : edge-gateway prend le relais |
| HMAC `internal_service_client.call()` | Pas dans le template (groupes ne s'appellent pas) | Ajout post-hackathon |
| `integrations-api` (Stripe, OpenAI, etc.) | `app.integrations.openrouter.LLMClient` direct | Remplacement par HMAC `integrations-api` |
| `bots-api` (AI Tutor, tool calling, RAG) | `app.integrations.openrouter.LLMClient.complete()` | Remplacement par HMAC `bots-api` |
| `structlog` + `orjson` config | `logging` stdlib | Remplacement |
| `NATS` event publishing | Pas dans le template | Ajout post-hackathon (consumers + publishers) |
| `Alembic` migrations | Idem (déjà aligné) | Conserver |
| `JSend` response format | `app.core.responses` (helpers identiques) | Conserver, juste import path différent |

## Usage par les groupes

### 1. Cloner le template

```bash
cp -r hackathon/template/backend hackathon/group-X-xxx/backend
cd hackathon/group-X-xxx/backend
```

### 2. Setup local

```bash
cp .env.example .env
# Renseigner DATABASE_URL, SUPABASE_*, OPENROUTER_API_KEY dans .env

make install
make dev
```

L'API tourne sur `http://localhost:8000`. Swagger UI sur `http://localhost:8000/docs`.

### 3. Ajouter ses entités

Pour chaque entité du contrat (cf. `hackathon/contracts/group-X-xxx/`) :

1. Créer `app/models/{entity}.py` (SQLAlchemy ORM)
2. Créer `app/schemas/{entity}.py` (Pydantic)
3. Créer `app/services/{entity}_service.py` (logique métier)
4. Créer `app/api/v1/endpoints/{entity}.py` (routes)
5. Enregistrer dans `app/api/v1/router.py`
6. Créer la migration Alembic : `make migrate-create msg="add_{entity}_table"`

Modèle à dupliquer : `example_domain` (5 fichiers exemple cohérents).

## Conventions non-négociables

Voir `hackathon/contracts/README.md` pour les conventions détaillées (naming, types, JSend, etc.). En bref :

- ✅ **snake_case** partout
- ✅ **UUID v4** pour les PKs
- ✅ **BIGINT centimes** pour les montants
- ✅ **JSend** pour les réponses
- ✅ **Soft delete** via `deleted_at`
- ✅ **Async** partout (pas de sync DB calls)
- ❌ Pas d'import wildcard
- ❌ Pas de logique métier dans les routes
- ❌ Pas de print (utiliser logger)
- ❌ Pas de URLs hardcodées

## Pour Claude Code post-hackathon

Si tu es Claude Code en train de migrer ce code vers le backbone Hello Mira, **commence par lire `MIGRATION_GUIDE.md`**. Toutes les transformations à effectuer y sont listées avec exemples avant/après.

Les `MIGRATION HINT` dans le code source pointent vers les sections du guide.
