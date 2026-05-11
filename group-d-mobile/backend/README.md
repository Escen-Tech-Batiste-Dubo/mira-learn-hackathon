# Backend FastAPI — Template hackathon

Backend Python/FastAPI vanilla, structuré pour reprenabilité Claude Code post-hackathon.

> Voir `../README.md` pour le contexte général et `../MIGRATION_GUIDE.md` pour les transformations cibles vers le backbone Hello Mira.

## Setup

```bash
# 1. Copier la config d'env
cp .env.example .env

# 2. Renseigner les valeurs dans .env :
#    - DATABASE_URL (Supabase ou Postgres local)
#    - SUPABASE_URL, SUPABASE_ANON_KEY
#    - OPENROUTER_API_KEY (fourni par ton encadrant Hello Mira)

# 3. Installer les dépendances
make install

# 4. Appliquer les migrations
make migrate

# 5. Démarrer en mode dev
make dev
```

API sur `http://localhost:8000`.
Swagger UI sur `http://localhost:8000/docs`.

## Commandes

| Commande | Description |
|---|---|
| `make install` | Installe Python deps depuis `requirements-dev.txt` |
| `make dev` | Démarre uvicorn avec reload auto (port 8000) |
| `make test` | Lance pytest avec coverage |
| `make lint` | Vérifie le code (ruff + mypy) |
| `make format` | Formate le code (ruff format + ruff check --fix) |
| `make migrate` | Applique les migrations Alembic |
| `make migrate-create msg="add_xxx_table"` | Crée une nouvelle migration |

## Structure

```
backend/
├── main.py                              # entrée FastAPI (create_app factory)
├── alembic.ini                          # config Alembic
├── alembic/
│   ├── env.py                           # config async + metadata target
│   ├── script.py.mako                   # template migrations
│   └── versions/                        # migrations (vide au départ)
├── app/
│   ├── api/v1/                          # routes versionnées
│   │   ├── router.py                    # agrégation
│   │   └── endpoints/
│   │       ├── health.py                # /health, /version
│   │       └── example.py               # CRUD exemple à dupliquer
│   ├── core/                            # infrastructure
│   │   ├── auth.py                      # JWT Supabase + require_auth/require_role
│   │   ├── config.py                    # pydantic Settings
│   │   ├── db.py                        # SQLAlchemy async engine + sessions
│   │   ├── responses.py                 # JSend helpers
│   │   └── exceptions.py                # AppException + sous-classes
│   ├── integrations/
│   │   └── openrouter.py                # LLMClient OpenRouter (isolé)
│   ├── models/                          # SQLAlchemy ORM
│   │   ├── base.py                      # Base + Mixins audit
│   │   └── example.py                   # modèle exemple
│   ├── schemas/                         # Pydantic v2
│   │   └── example.py                   # schémas exemple
│   └── services/                        # logique métier
│       └── example_service.py           # service exemple
├── tests/
│   ├── conftest.py                      # fixtures pytest
│   └── test_example.py                  # tests minimaux
├── requirements.txt                     # deps prod
├── requirements-dev.txt                 # deps dev (test + lint)
├── pytest.ini
├── Makefile
└── .env.example
```

## Ajouter une nouvelle entité (workflow)

Pour chaque entité du contrat (`hackathon/contracts/group-X-xxx/{entity}.md`) :

### 1. Modèle SQLAlchemy

Créer `app/models/{entity}.py` :
```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, SoftDeleteMixin, TimestampMixin


class MiraClass(Base, IDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "mira_class"
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # ... champs selon contrat
```

Importer dans `alembic/env.py` :
```python
from app.models import example, mira_class  # noqa: F401
```

### 2. Schémas Pydantic

Créer `app/schemas/{entity}.py` avec Base + Create + Update + Read (voir `app/schemas/example.py`).

### 3. Service métier

Créer `app/services/{entity}_service.py` avec fonctions `create_X`, `get_X`, `list_X`, `update_X`, `delete_X`. **Aucune logique métier dans les routes.**

### 4. Routes

Créer `app/api/v1/endpoints/{entity}.py` (voir `app/api/v1/endpoints/example.py`).

### 5. Enregistrer dans le router

`app/api/v1/router.py` :
```python
from app.api.v1.endpoints import example, mira_class
router.include_router(mira_class.router, prefix="/classes", tags=["classes"])
```

### 6. Migration Alembic

```bash
make migrate-create msg="add_mira_class_table"
# Inspecter le fichier généré dans alembic/versions/ avant d'appliquer
make migrate
```

### 7. Tests

Créer `tests/test_{entity}.py` (voir `tests/test_example.py`).

## Conventions non-négociables

(Voir `hackathon/contracts/README.md` pour les détails complets)

1. **JSend partout** : utilisez les helpers `success_response()`, `fail_response()`, `error_response()` depuis `app.core.responses`
2. **Aucune logique métier dans les routes** — tout dans `app/services/`
3. **Async partout** — pas de sync DB ni `time.sleep`
4. **snake_case** partout
5. **UUIDs string format** pour les IDs (générés par `app.models.base._generate_uuid`)
6. **BIGINT centimes** pour les montants (`Mapped[int]` avec `BigInteger`)
7. **Soft delete** uniquement (sauf RGPD explicite)
8. **`exc_info=True`** dans les `except Exception` blocs

## Anti-patterns interdits

- ❌ `import time; time.sleep(...)` (bloque l'event loop async)
- ❌ `import requests` (synchrone — utiliser `httpx` async)
- ❌ `print(...)` (utiliser `logger`)
- ❌ Logique métier dans `endpoints/` — tout dans `services/`
- ❌ Requêtes DB directes dans `endpoints/` — passer par `services/`
- ❌ URLs hardcodées — toujours dans `app.core.config.Settings`
- ❌ Modèles SQLAlchemy sans migration Alembic
- ❌ Imports wildcard (`from app.X import *`)

## Pour la migration post-hackathon

Tous les fichiers contiennent des commentaires `MIGRATION HINT` qui pointent vers les sections du `MIGRATION_GUIDE.md`. Claude Code utilisera ces hints pour faire la migration vers `ms-common-api` / `bots-api` / `integrations-api`.

**Plus de détails dans `../MIGRATION_GUIDE.md`.**
