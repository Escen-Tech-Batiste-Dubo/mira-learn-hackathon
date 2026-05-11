"""
Database session factory (SQLAlchemy 2.0 async).

MIGRATION HINT (post-hackathon) :
    Remplacé par `ms_common_api.database` :
        from ms_common_api.database import get_db, AsyncSessionLocal

    BaseMicroservice initialise automatiquement la session factory au boot
    avec retry, pool tuning Hello Mira standard, monitoring metrics.

    Voir `MIGRATION_GUIDE.md` section "Database session → ms-common-api".
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# Engine async (asyncpg driver)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Hook startup — validation connexion DB."""
    async with engine.connect() as conn:
        await conn.execute(__import__("sqlalchemy").text("SELECT 1"))


async def close_db() -> None:
    """Hook shutdown — disposal pool DB."""
    await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency FastAPI pour injecter une session DB par requête.

    Usage :
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
