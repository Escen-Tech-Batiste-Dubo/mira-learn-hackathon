"""
Agrégation des routers v1.

MIGRATION HINT (post-hackathon) :
    Pattern conservé tel quel — chaque service backbone a son propre router agrégateur.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import example, health, modules_quiz, quizzes

router = APIRouter()

# Health checks (toujours en premier — utilisé par K8s liveness/readiness probes)
router.include_router(health.router, tags=["health"])

# Routes métier (1 inclusion par fichier endpoint)
router.include_router(example.router, prefix="/examples", tags=["examples"])
router.include_router(modules_quiz.router, prefix="/modules", tags=["modules"])
router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])

# Ajouter ici les autres routes au fur et à mesure :
# router.include_router(mira_class.router, prefix="/classes", tags=["classes"])
# router.include_router(mentor.router,     prefix="/mentors", tags=["mentors"])
# ...
