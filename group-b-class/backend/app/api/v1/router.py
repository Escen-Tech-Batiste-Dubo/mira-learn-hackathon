"""
Agrégation des routers v1.

MIGRATION HINT (post-hackathon) :
    Pattern conservé tel quel — chaque service backbone a son propre router agrégateur.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, mira_class, mira_class_modules, mira_class_session, skill

router = APIRouter()

# Health checks (toujours en premier — utilisé par K8s liveness/readiness probes)
router.include_router(health.router, tags=["health"])

# Routes métier (1 inclusion par fichier endpoint)
router.include_router(mira_class.router, prefix="/classes", tags=["classes"])
router.include_router(mira_class_session.router, tags=["sessions"])
router.include_router(skill.router, prefix="/skills", tags=["skills"])
router.include_router(mira_class_modules.router, prefix="/classes", tags=["modules"])

# Ajouter ici les autres routes au fur et à mesure :
# router.include_router(mentor.router,     prefix="/mentors", tags=["mentors"])
# ...
