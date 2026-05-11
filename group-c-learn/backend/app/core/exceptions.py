"""
Exceptions métier custom + handlers.

MIGRATION HINT (post-hackathon) :
    `AppException` reste — le pattern est repris par `ms_common_api.exceptions`
    avec en plus :
        - Code d'erreur métier standardisé (LEARN_4001, MENTOR_4002, etc.)
        - i18n des messages
        - Audit log automatique des erreurs critiques

    Voir `MIGRATION_GUIDE.md`.
"""
from typing import Any


class AppException(Exception):
    """Exception métier de l'application.

    Convertie automatiquement en réponse JSend `error` par le handler global
    enregistré dans `main.py`.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        data: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data


class NotFoundError(AppException):
    """Ressource non trouvée."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            message=f"{resource} not found: {identifier}",
            status_code=404,
            data={"resource": resource, "identifier": identifier},
        )


class ValidationError(AppException):
    """Erreur de validation métier (en plus de pydantic)."""

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(
            message=message,
            status_code=422,
            data={"field": field} if field else None,
        )


class ConflictError(AppException):
    """Conflit métier (état incompatible avec l'action)."""

    def __init__(self, message: str, data: Any = None) -> None:
        super().__init__(message=message, status_code=409, data=data)


class ForbiddenError(AppException):
    """Action interdite par les règles métier (au-delà de l'auth role)."""

    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message=message, status_code=403)
