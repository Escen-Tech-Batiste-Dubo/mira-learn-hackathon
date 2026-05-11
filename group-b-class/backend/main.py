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
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.db import close_db, init_db
from app.core.exceptions import AppException
from app.core.responses import error_response, fail_response

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifecycle hooks."""
    logger.info("Starting %s (build %s)", settings.SERVICE_NAME, settings.BUILD_SHA)
    await init_db()
    try:
        yield
    finally:
        logger.info("Shutting down %s", settings.SERVICE_NAME)
        await close_db()


def create_app() -> FastAPI:
    """Factory FastAPI."""
    app = FastAPI(
        title=settings.SERVICE_NAME,
        version=settings.BUILD_SHA,
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
        lifespan=lifespan,
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
        message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
        return JSONResponse(
            status_code=exc.status_code,
            content=fail_response(data={"detail": exc.detail}, message=message),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=fail_response(data={"errors": exc.errors()}, message="Validation error"),
        )

    # Routes
    app.include_router(v1_router, prefix="/v1")

    return app


app = create_app()
