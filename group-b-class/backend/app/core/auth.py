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
        return _jwks_cache

    url = settings.supabase_jwks_url()
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(
            url,
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
            },
        )
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


async def _verify_token_with_auth_server(token: str) -> dict[str, Any]:
    """Valide le token via Supabase Auth quand JWKS n'est pas disponible."""
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                url,
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as exc:
        logger.error("Failed to reach Supabase Auth user endpoint: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service temporarily unavailable",
        ) from exc

    if response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("Supabase Auth user endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service temporarily unavailable",
        ) from exc

    user = response.json()
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "sub": user_id,
        "email": user.get("email"),
        "user_metadata": user.get("user_metadata") or {},
        "app_metadata": user.get("app_metadata") or {},
        "aud": user.get("aud", "authenticated"),
        "role": user.get("role", "authenticated"),
    }


async def _decode_jwt(token: str) -> dict[str, Any]:
    """Décode + valide un JWT Supabase via JWKS RS256."""
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg")
    except JWTError as exc:
        logger.warning("JWT header validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not kid or alg == "HS256":
        return await _verify_token_with_auth_server(token)

    try:
        jwks = await _fetch_jwks()
    except httpx.HTTPError as exc:
        logger.warning("Failed to fetch JWKS, falling back to Supabase Auth: %s", exc)
        return await _verify_token_with_auth_server(token)

    try:
        key = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
        if not key:
            logger.warning("Signing key %r not found in JWKS, falling back to Supabase Auth", kid)
            return await _verify_token_with_auth_server(token)

        key_algorithm = key.get("alg")
        algorithms = [key_algorithm] if isinstance(key_algorithm, str) else ["RS256", "ES256"]

        return jwt.decode(
            token,
            key=key,
            algorithms=algorithms,
            audience="authenticated",
            options={"verify_aud": True},
        )
    except JWTError as exc:
        logger.warning("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


UserRole = Literal["nomad", "mentor", "admin"]


def _read_trusted_role(value: object) -> UserRole | None:
    """Read a trusted role from app metadata only."""
    if not isinstance(value, dict):
        return None
    role = value.get("role")
    if role in ("nomad", "mentor", "admin"):
        return role
    return None


class AuthenticatedUser:
    """User authentifié extrait du JWT.

    MIGRATION HINT (post-hackathon) :
        Remplacé par `ms_common_api.auth.User` qui contient en plus :
            - scopes: list[str]  (depuis edge-gateway X-Computed-Scopes)
            - tenant_id, is_founder, is_internal, ...
    """

    def __init__(self, user_id: str, email: str | None, role: UserRole) -> None:
        self.user_id = user_id
        self.email = email
        self.role = role

    def __repr__(self) -> str:
        return f"AuthenticatedUser(user_id={self.user_id!r}, role={self.role!r})"


async def require_auth(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    """FastAPI dependency : extrait user authentifié du header Authorization.

    Usage :
        @router.get("/me")
        async def get_me(user: AuthenticatedUser = Depends(require_auth)):
            return user
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization[len("Bearer "):]
    payload = await _decode_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: no sub claim")

    email = payload.get("email")
    app_metadata = payload.get("app_metadata", {}) or {}
    role = _read_trusted_role(app_metadata) or "nomad"

    if "user_metadata" in payload and not _read_trusted_role(app_metadata):
        logger.debug("Ignoring untrusted user_metadata role for user %s", user_id)

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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires role in {allowed_roles}",
            )
        return user

    return _check
