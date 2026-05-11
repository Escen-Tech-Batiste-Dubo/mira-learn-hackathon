"""
Auth middleware : valide JWT Supabase via JWKS (RS256), extrait user_id + role.

MIGRATION HINT (post-hackathon) :
    En production Hello Mira, ce module est **complètement supprimé**.
    L'edge-gateway upstream valide le JWT Supabase et injecte 3 headers :
        - X-User-Id        : UUID Supabase auth.users.id
        - X-User-Email     : email (si scope user_email)
        - X-Computed-Scopes : CSV des scopes calculés (ex "classes:read:public,classes:write:own")

    Côté service, on utilise :
        from ms_common_api.auth import current_user, require_scope

        @router.post("/classes")
        async def create_class(
            user: User = Depends(current_user),
            _: None = Depends(require_scope("classes:write:own")),
        ):
            ...

    Transformation hackathon → backbone :
        - require_auth(...)       → current_user (Depends)
        - require_role("mentor")  → require_scope("classes:write:own")
        - require_role("admin")   → require_scope("classes:write:admin")

    Voir `MIGRATION_GUIDE.md` section "Auth custom JWT → edge-gateway scopes".
"""
import json
import logging
from typing import Any, Literal

import httpx
from fastapi import Header, HTTPException, status
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings

logger = logging.getLogger(__name__)


_jwks_cache: dict[str, Any] | None = None


async def _fetch_jwks() -> dict[str, Any]:
    """Récupère les JWKS Supabase (cache in-memory pour la session).

    En V1 prod, edge-gateway fait ce fetch + cache Redis distribué.
    """
    global _jwks_cache
    if _jwks_cache is not None:
        logger.info("[auth-jwks] cache hit (pas de requete HTTP)")
        return _jwks_cache

    url = settings.supabase_jwks_url()
    # WHY : le gateway Supabase exige l’en-tête `apikey` (clé anon) sur /auth/v1/* ;
    # sans lui, JWKS répond 401 et on mappe à tort un 503 « Auth unavailable ».
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    }
    logger.info("[auth-jwks] GET %s", url)
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(url, headers=headers)
            logger.info("[auth-jwks] reponse HTTP %s", response.status_code)
            response.raise_for_status()
            _jwks_cache = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "[auth-jwks] echec HTTP %s body=%s",
                exc.response.status_code,
                exc.response.text[:400],
            )
            raise
        except httpx.HTTPError as exc:
            logger.error("[auth-jwks] erreur reseau/timeout : %s", exc)
            raise
        except json.JSONDecodeError as exc:
            logger.error("[auth-jwks] corps JWKS non JSON : %s", exc)
            raise

    n_keys = len(_jwks_cache.get("keys", [])) if isinstance(_jwks_cache, dict) else 0
    logger.info("[auth-jwks] OK charge %s cle(s)", n_keys)
    return _jwks_cache


async def _decode_jwt(token: str) -> dict[str, Any]:
    """Décode + valide un JWT Supabase via JWKS (RS256 ou ES256 selon le projet)."""
    logger.info("[auth] decode_jwt (JWKS + signature)")
    try:
        jwks = await _fetch_jwks()
    except httpx.HTTPError as exc:
        logger.error(
            "[auth] JWKS indisponible -> HTTP 503 client (voir logs [auth-jwks] ci-dessus). Err: %s",
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service temporarily unavailable",
        )

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise JWTError("Missing 'kid' header")

        key = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
        if not key:
            raise JWTError("Signing key not found in JWKS")

        claims = jwt.decode(
            token,
            key=key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
        logger.info("[auth] JWT OK sub=%s…", str(claims.get("sub", ""))[:8])
        return claims
    except JWTError as exc:
        logger.warning("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


UserRole = Literal["nomad", "mentor", "admin"]


class AuthenticatedUser:
    """User authentifié extrait du JWT.

    MIGRATION HINT (post-hackathon) :
        Remplacé par `ms_common_api.auth.User` qui contient en plus :
            - scopes: list[str]  (depuis edge-gateway X-Computed-Scopes)
            - tenant_id, is_founder, is_internal, ...
    """

    def __init__(self, user_id: str, email: str | None, role: str) -> None:
        self.user_id = user_id
        self.email = email
        self.role: UserRole = role  # type: ignore[assignment]

    def __repr__(self) -> str:
        return f"AuthenticatedUser(user_id={self.user_id!r}, role={self.role!r})"


async def require_auth(authorization: str = Header(...)) -> AuthenticatedUser:
    """FastAPI dependency : extrait user authentifié du header Authorization.

    Usage :
        @router.get("/me")
        async def get_me(user: AuthenticatedUser = Depends(require_auth)):
            return user
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization[len("Bearer "):]
    logger.info("[auth] require_auth Bearer recu (longueur token=%s)", len(token))
    payload = await _decode_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: no sub claim")

    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {}) or {}
    role = user_metadata.get("role", "nomad")

    if role not in ("nomad", "mentor", "admin"):
        logger.warning("Unknown role %r in JWT for user %s, defaulting to nomad", role, user_id)
        role = "nomad"

    return AuthenticatedUser(user_id=user_id, email=email, role=role)


def require_role(*allowed_roles: UserRole):
    """FastAPI dependency factory : exige un role spécifique.

    MIGRATION HINT (post-hackathon) :
        Remplacé par `ms_common_api.auth.require_scope("scope:action:scope")`.
        Mapping hackathon → backbone Mira Learn :
            require_role("mentor")          → require_scope("classes:write:own")
            require_role("mentor", "admin") → require_scope_any("classes:write:own", "classes:write:admin")
            require_role("admin")           → require_scope("classes:write:admin")
            require_role("nomad")           → require_scope("learn:read:own")

    Usage :
        @router.post("/classes")
        async def create(
            body: ClassCreate,
            user: AuthenticatedUser = Depends(require_role("mentor")),
        ):
            ...
    """

    async def _check(user: AuthenticatedUser = __import__("fastapi").Depends(require_auth)) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            logger.warning(
                "[auth] require_role refuse role=%r (autorises=%s) user=%s…",
                user.role,
                allowed_roles,
                (user.user_id or "")[:8],
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires role in {allowed_roles}",
            )
        logger.info("[auth] require_role OK role=%r", user.role)
        return user

    return _check
