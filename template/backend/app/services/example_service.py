"""
Service métier pour Example.

Convention Hello Mira (NON-NÉGOCIABLE) :
    - **Aucune logique métier dans les routes** (`app/api/v1/endpoints/`)
    - Les routes appellent uniquement des fonctions de service
    - Les services manipulent les modèles SQLAlchemy + appellent les intégrations
    - Cette séparation permet :
        * Tests unitaires des services (sans HTTP)
        * Réutilisation cross-routes
        * Migration mécanique vers Hello Mira backbone (1 fichier service → 1 service backbone)

MIGRATION HINT (post-hackathon) :
    Le contenu de ce fichier migre tel quel vers `app/services/example_service.py`
    du microservice backbone correspondant. Seuls les imports changent
    (UnifiedModel, ms-common-api.responses, etc.).

    Voir `MIGRATION_GUIDE.md`.
"""
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.example import Example
from app.schemas.example import ExampleCreate, ExampleUpdate


async def create_example(db: AsyncSession, body: ExampleCreate) -> Example:
    """Créer une nouvelle entité Example."""
    instance = Example(
        title=body.title,
        description=body.description,
        status=body.status,
    )
    db.add(instance)
    await db.flush()  # pour avoir l'id généré sans commit immédiat
    return instance


async def get_example(db: AsyncSession, example_id: str) -> Example:
    """Récupérer un Example par son id (soft-delete-aware)."""
    stmt = select(Example).where(
        Example.id == example_id,
        Example.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(resource="Example", identifier=example_id)
    return instance


async def list_examples(
    db: AsyncSession,
    limit: int = 20,
    offset: int = 0,
    status: str | None = None,
) -> tuple[Sequence[Example], int]:
    """Lister les Examples avec pagination."""
    stmt = select(Example).where(Example.deleted_at.is_(None))
    if status:
        stmt = stmt.where(Example.status == status)

    # Count total avant pagination (pour la pagination cliente)
    count_stmt = select(__import__("sqlalchemy").func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Page
    stmt = stmt.order_by(Example.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return items, total


async def update_example(
    db: AsyncSession,
    example_id: str,
    body: ExampleUpdate,
) -> Example:
    """Mettre à jour un Example (partiel)."""
    instance = await get_example(db, example_id)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(instance, field, value)
    await db.flush()
    return instance


async def delete_example(db: AsyncSession, example_id: str) -> None:
    """Soft delete d'un Example."""
    from datetime import datetime, timezone

    instance = await get_example(db, example_id)
    instance.deleted_at = datetime.now(timezone.utc)
    await db.flush()
