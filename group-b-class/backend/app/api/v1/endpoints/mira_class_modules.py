"""
Routes HTTP pour `mira_class_module`.

Router thin : validation HTTP, auth et sérialisation JSend uniquement.
"""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_db
from app.models.module import MiraClassModule
from app.core.responses import fail_response, success_response
from app.schemas.module import (
    MiraClassModuleCreate,
    MiraClassModuleRead,
    MiraClassModuleReorder,
    MiraClassModuleUpdate,
)
from app.services.module_service import ModuleService

router = APIRouter()


def _serialize_module_read(module: MiraClassModule, quiz_count: int) -> dict:
    return (
        MiraClassModuleRead.model_validate(module)
        .model_copy(update={"quiz_count": quiz_count})
        .model_dump(mode="json")
    )


def get_module_service(db: AsyncSession = Depends(get_db)) -> ModuleService:
    """Factory DIP pour injecter `ModuleService`."""
    return ModuleService(db)


@router.get("/{class_id}/modules", summary="Lister les modules d'une class")
async def list_modules(
    class_id: str,
    service: ModuleService = Depends(get_module_service),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    modules = await service.list_modules(class_id, user.user_id)
    counts = await service.quiz_counts_for_module_ids([m.id for m in modules])
    return success_response(
        data={
            "modules": [
                _serialize_module_read(module, counts.get(module.id, 0))
                for module in modules
            ]
        }
    )


@router.post(
    "/{class_id}/modules",
    status_code=status.HTTP_201_CREATED,
    summary="Créer un module pour une class",
)
async def create_module(
    class_id: str,
    body: MiraClassModuleCreate,
    service: ModuleService = Depends(get_module_service),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    module = await service.create_module(class_id, body, user.user_id)
    counts = await service.quiz_counts_for_module_ids([module.id])
    return success_response(
        data={
            "module": _serialize_module_read(module, counts.get(module.id, 0)),
        }
    )


@router.patch(
    "/{class_id}/modules/reorder",
    summary="Réordonner les modules d'une class",
)
async def reorder_modules(
    class_id: str,
    body: MiraClassModuleReorder,
    service: ModuleService = Depends(get_module_service),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    modules = await service.reorder_modules(class_id, body, user.user_id)
    counts = await service.quiz_counts_for_module_ids([m.id for m in modules])
    return success_response(
        data={
            "modules": [
                _serialize_module_read(module, counts.get(module.id, 0))
                for module in modules
            ]
        }
    )


@router.patch(
    "/{class_id}/modules/{module_id}",
    summary="Mettre à jour un module",
)
async def update_module(
    class_id: str,
    module_id: str,
    body: MiraClassModuleUpdate,
    service: ModuleService = Depends(get_module_service),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    if not body.model_dump(exclude_none=True):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=fail_response(data={"body": "no fields to update"}, message="Empty update body"),
        )

    module = await service.update_module(class_id, module_id, body, user.user_id)
    counts = await service.quiz_counts_for_module_ids([module.id])
    return success_response(
        data={
            "module": _serialize_module_read(module, counts.get(module.id, 0)),
        }
    )


@router.delete(
    "/{class_id}/modules/{module_id}",
    summary="Soft delete d'un module",
)
async def delete_module(
    class_id: str,
    module_id: str,
    service: ModuleService = Depends(get_module_service),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    await service.delete_module(class_id, module_id, user.user_id)
    return success_response(data={}, message="Module supprimé")
