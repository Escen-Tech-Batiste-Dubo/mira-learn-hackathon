# Makefile — commandes essentielles du backend hackathon.

.PHONY: install dev test lint format migrate migrate-create help

help:
	@echo "Commandes disponibles :"
	@echo "  make install         - installe les dépendances Python (.venv)"
	@echo "  make dev             - démarre l'API en mode dev (reload auto, port 8000)"
	@echo "  make test            - lance les tests pytest"
	@echo "  make lint            - vérifie le code avec ruff + mypy"
	@echo "  make format          - formate le code avec ruff"
	@echo "  make migrate         - applique les migrations DB (alembic upgrade head)"
	@echo "  make migrate-create  - crée une nouvelle migration (msg=\"add_xxx_table\")"

install:
	@command -v uv >/dev/null 2>&1 && uv pip install -r requirements-dev.txt || python -m pip install -r requirements-dev.txt

dev:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest

lint:
	ruff check app tests
	mypy app

format:
	ruff format app tests
	ruff check --fix app tests

migrate:
	alembic upgrade head

migrate-create:
	@if [ -z "$(msg)" ]; then echo 'Usage : make migrate-create msg="add_xxx_table"'; exit 1; fi
	alembic revision --autogenerate -m "$(msg)"
