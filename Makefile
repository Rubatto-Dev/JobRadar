.PHONY: up down logs lint test test-cov shell migrate

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f api

lint:
	cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src/

test:
	cd backend && uv run pytest -v

test-cov:
	cd backend && uv run pytest --cov=src --cov-report=term-missing -v

shell:
	docker compose exec api bash

migrate:
	docker compose exec api alembic upgrade head
