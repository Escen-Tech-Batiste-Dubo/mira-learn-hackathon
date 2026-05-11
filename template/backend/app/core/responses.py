"""
JSend response format helpers.

Format JSend : https://github.com/omniti-labs/jsend
    Success : {"status": "success", "data": {...}, "message": null}
    Fail    : {"status": "fail",    "data": {...}, "message": "validation message"}
    Error   : {"status": "error",   "data": null,  "message": "error description"}

MIGRATION HINT (post-hackathon) :
    Remplacé par `from ms_common_api.responses import success_response, fail_response, error_response`.
    Format identique → aucune adaptation de signature, juste l'import à changer.

    Le module backbone ajoute :
        - Propagation automatique du request_id (depuis structlog context)
        - Catalogue des codes d'erreur métier (LEARN_4001, MENTOR_4002, etc.)
        - Locale-aware error messages (i18n)

    Voir `MIGRATION_GUIDE.md` section "JSend responses".
"""
from typing import Any


def success_response(data: Any = None, message: str | None = None) -> dict[str, Any]:
    """JSend success — opération réussie.

    HTTP status à utiliser : 200, 201, 202, 204.
    """
    return {"status": "success", "data": data, "message": message}


def fail_response(data: Any, message: str | None = None) -> dict[str, Any]:
    """JSend fail — validation utilisateur ou état métier invalide.

    HTTP status à utiliser : 400, 409, 422.
    Le `data` contient typiquement des détails sur le champ qui a failli.
    Exemple : {"field": "email", "reason": "already exists"}
    """
    return {"status": "fail", "data": data, "message": message}


def error_response(message: str, data: Any = None) -> dict[str, Any]:
    """JSend error — erreur serveur (exception non gérée, dépendance externe HS).

    HTTP status à utiliser : 500, 502, 503, 504.
    """
    return {"status": "error", "data": data, "message": message}
