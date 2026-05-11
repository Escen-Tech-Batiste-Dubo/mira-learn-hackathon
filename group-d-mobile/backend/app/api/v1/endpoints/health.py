"""
Health check endpoints.

MIGRATION HINT (post-hackathon) :
    Remplacé automatiquement par BaseMicroservice qui fournit /health, /ready, /version
    pré-configurés (avec validation DB/NATS/Redis selon enabled).

    Ce fichier sera supprimé post-hackathon.
"""
from fastapi import APIRouter

from app.core.config import settings
from app.core.responses import success_response

router = APIRouter()


@router.get("/health", summary="Liveness probe")
async def health() -> dict:
    """Le service répond. Utilisé par K8s liveness probe."""
    return success_response(data={"status": "ok"})


@router.get("/version", summary="Build info")
async def version() -> dict:
    """Informations de build pour debug."""
    return success_response(
        data={
            "service": settings.SERVICE_NAME,
            "build_sha": settings.BUILD_SHA,
            "build_date": settings.BUILD_DATE,
            "environment": settings.ENVIRONMENT,
        }
    )
