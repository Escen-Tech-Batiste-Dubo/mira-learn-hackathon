"""SQLAlchemy models for Group B — Mira Class backoffice.

Import side-effect : enregistre tous les modèles sur ``Base.metadata`` (Alembic).
"""
from app.models.mentor_profile import MentorProfile  # noqa: F401
from app.models.mira_class import MiraClass  # noqa: F401
from app.models.mira_class_enrolment import MiraClassEnrolment  # noqa: F401
from app.models.mira_class_session import MiraClassSession  # noqa: F401
from app.models.mira_class_session_module import MiraClassSessionModule  # noqa: F401
from app.models.mira_class_session_module_material import MiraClassSessionModuleMaterial  # noqa: F401
from app.models.module import MiraClassModule  # noqa: F401
from app.models.quiz import (  # noqa: F401
    MiraClassModuleQuiz,
    MiraClassModuleQuizOption,
    MiraClassModuleQuizQuestion,
)
from app.models.skill import Skill  # noqa: F401

__all__ = [
    "MentorProfile",
    "MiraClass",
    "MiraClassEnrolment",
    "MiraClassModule",
    "MiraClassModuleQuiz",
    "MiraClassModuleQuizOption",
    "MiraClassModuleQuizQuestion",
    "MiraClassSession",
    "MiraClassSessionModule",
    "MiraClassSessionModuleMaterial",
    "Skill",
]
