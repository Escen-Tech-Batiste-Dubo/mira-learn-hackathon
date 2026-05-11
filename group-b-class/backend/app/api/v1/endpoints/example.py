"""
Routes pour l'entité Example — référence canonique.

Convention Hello Mira (NON-NÉGOCIABLE) :
    - Les routes appellent **uniquement** des fonctions de `app/services/`
    - Pas de logique métier ici, pas de requête DB directe
    - Toutes les réponses utilisent les helpers JSend (`success_response`, ...)
    - Auth via dependencies `require_auth` / `require_role`

Ce fichier sert de template à dupliquer pour chaque entité du groupe.

MIGRATION HINT (post-hackathon) :
    Routes migrées telles quelles vers `app/api/v1/endpoints/{entity}.py` du
    service backbone. Seuls les imports changent :
        - require_role(...) → require_scope("scope:action:scope")
        - app.core.responses → ms_common_api.responses
        - app.core.auth → ms_common_api.auth

    Voir `MIGRATION_GUIDE.md`.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_auth, require_role
from app.core.db import get_db
from app.core.responses import fail_response, success_response
from app.schemas.example import ExampleCreate, ExampleRead, ExampleUpdate
from app.services import example_service

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Créer un Example",
)
async def create_example(
    body: ExampleCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor", "admin")),
    # MIGRATION HINT : remplacer require_role("mentor", "admin") par
    # require_scope_any("examples:write:own", "examples:write:admin")
) -> dict:
    """Crée un nouvel Example.

    **Auth** : mentor ou admin.
    **Réponse JSend** : `{status: success, data: ExampleRead}`.
    """
    instance = await example_service.create_example(db, body)
    return success_response(data=ExampleRead.model_validate(instance).model_dump(mode="json"))


@router.get("", summary="Lister les Examples")
async def list_examples(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: str | None = Query(default=None, alias="status"),
) -> dict:
    """Liste paginée des Examples.

    **Auth** : tout user authentifié.
    """
    items, total = await example_service.list_examples(
        db,
        limit=limit,
        offset=offset,
        status=status_filter,
    )
    return success_response(
        data={
            "items": [ExampleRead.model_validate(i).model_dump(mode="json") for i in items],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "returned": len(items),
            },
        }
    )


@router.get("/{example_id}", summary="Détail d'un Example")
async def get_example(
    example_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    """Récupère un Example par son id. 404 si introuvable ou soft-deleted."""
    instance = await example_service.get_example(db, example_id)
    return success_response(data=ExampleRead.model_validate(instance).model_dump(mode="json"))


@router.patch("/{example_id}", summary="Mettre à jour un Example")
async def update_example(
    example_id: str,
    body: ExampleUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor", "admin")),
) -> dict:
    """Update partiel d'un Example. Seuls les champs fournis sont modifiés."""
    if not body.model_dump(exclude_unset=True):
        return fail_response(data={"body": "no fields to update"}, message="Empty update body")

    instance = await example_service.update_example(db, example_id, body)
    return success_response(data=ExampleRead.model_validate(instance).model_dump(mode="json"))


@router.delete("/{example_id}", summary="Soft delete d'un Example")
async def delete_example(
    example_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor", "admin")),
) -> dict:
    """Soft delete : marque `deleted_at = NOW()`. La donnée reste en base."""
    await example_service.delete_example(db, example_id)
    return success_response(data=None, message=f"Example {example_id} deleted")
