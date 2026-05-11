"""
FastAPI application entry point.

MIGRATION HINT (post-hackathon, backbone Hello Mira) :
    Le boilerplate FastAPI ci-dessous est remplacé par `BaseMicroservice` de
    `ms-common-api`, qui apporte automatiquement :
        - CORS, structlog request_id propagation, Sentry, Prometheus middleware
        - Routes /health, /ready, /version, /metrics
        - Lifespan NATS/Redis/PostgreSQL
        - Exception handlers JSend-aware
        - Validation env vars au boot

    Voir `MIGRATION_GUIDE.md` section "Configuration → BaseMicroservice".

    Code cible post-hackathon :
        from app.core.config import microservice
        app = microservice.app
        app.include_router(v1_router.router)
"""
import logging
import sys

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.db import close_db, init_db
from app.core.exceptions import AppException
from app.core.responses import error_response

_fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
_lvl = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

logging.basicConfig(level=_lvl, format=_fmt, stream=sys.stderr)

# WHY : uvicorn réconfigure souvent le root logger ; les `app.*` ne s’affichent plus.
# Handler dédié sur le package `app` → logs [auth], [quiz-gen], etc. toujours visibles.
_app_pkg = logging.getLogger("app")
_app_pkg.setLevel(_lvl)
if not _app_pkg.handlers:
    _h = logging.StreamHandler(sys.stderr)
    _h.setFormatter(logging.Formatter(_fmt))
    _app_pkg.addHandler(_h)
_app_pkg.propagate = False

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Factory FastAPI."""
    app = FastAPI(
        title=settings.SERVICE_NAME,
        version=settings.BUILD_SHA,
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
    )

    # CORS (hackathon : permissif, sera restreint en V1 prod via edge-gateway)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOW_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handler global (réponses JSend)
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=exc.message, data=exc.data),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        # WHY : les 503 « Auth unavailable » partent souvent avant toute log métier ([quiz-gen]).
        _line = f"[http] {request.method} {request.url.path} -> {exc.status_code} detail={exc.detail!r}"
        print(_line, flush=True, file=sys.stderr)
        logger.warning(
            "[http] %s %s -> %s detail=%s",
            request.method,
            request.url.path,
            exc.status_code,
            exc.detail,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )

    # Lifespan
    @app.on_event("startup")
    async def on_startup() -> None:
        logger.info("Starting %s (build %s)", settings.SERVICE_NAME, settings.BUILD_SHA)
        await init_db()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        logger.info("Shutting down %s", settings.SERVICE_NAME)
        await close_db()

    # Routes
    app.include_router(v1_router, prefix="/v1")

    @app.middleware("http")
    async def trace_incoming_requests(request: Request, call_next):
        # WHY : print stderr = visible même si la config logging uvicorn masque `app.*`.
        p = request.url.path
        if p.startswith("/v1"):
            print(f"[trace] >>> {request.method} {p}", flush=True, file=sys.stderr)
        try:
            response = await call_next(request)
        except BaseException:
            if p.startswith("/v1"):
                print(f"[trace] !!! EXC {request.method} {p}", flush=True, file=sys.stderr)
            raise
        if p.startswith("/v1"):
            print(f"[trace] <<< {response.status_code} {request.method} {p}", flush=True, file=sys.stderr)
        return response

    return app


app = create_app()
