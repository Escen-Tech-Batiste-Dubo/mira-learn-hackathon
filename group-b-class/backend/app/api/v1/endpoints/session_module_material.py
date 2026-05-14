"""HTTP routes for session module materials (mentor)."""

from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, require_role
from app.core.db import get_db
from app.core.responses import success_response
from app.schemas.session_module_material import (
    ModuleMaterialCountsResponse,
    SessionModuleMaterialCreate,
    SessionModuleMaterialListResponse,
    SessionModuleMaterialRead,
)
from app.services.session_module_material_service import (
    create_material,
    list_materials_for_session_module,
    material_counts_by_module,
)

router = APIRouter()


@router.get(
    "/classes/{class_id}/module-material-counts",
    summary="Compteurs matériel par module (toutes sessions)",
)
async def module_material_counts(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    counts = await material_counts_by_module(
        db, class_id=class_id, mentor_user_id=user.user_id
    )
    return success_response(data=ModuleMaterialCountsResponse(counts=counts).model_dump(mode="json"))


@router.get(
    "/classes/{class_id}/sessions/{session_id}/modules/{module_id}/materials",
    summary="Lister le matériel d'un module pour une session",
)
async def list_module_materials(
    class_id: str,
    session_id: str,
    module_id: str,
    phase: Literal["before", "during", "after"] | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    items = await list_materials_for_session_module(
        db,
        class_id=class_id,
        session_id=session_id,
        module_id=module_id,
        mentor_user_id=user.user_id,
        phase=phase,
    )
    return success_response(
        data=SessionModuleMaterialListResponse(
            materials=[SessionModuleMaterialRead.model_validate(m) for m in items],
        ).model_dump(mode="json"),
    )


@router.post(
    "/classes/{class_id}/sessions/{session_id}/modules/{module_id}/materials",
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter un matériel (fichier via URL Storage ou lien externe)",
)
async def create_module_material(
    class_id: str,
    session_id: str,
    module_id: str,
    body: SessionModuleMaterialCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role("mentor")),
) -> dict:
    row = await create_material(
        db,
        class_id=class_id,
        session_id=session_id,
        module_id=module_id,
        mentor_user_id=user.user_id,
        body=body,
    )
    return success_response(data=SessionModuleMaterialRead.model_validate(row).model_dump(mode="json"))
