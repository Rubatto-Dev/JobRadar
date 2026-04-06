"""Testes de integracao para o health endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.integration
class TestHealthEndpoint:
    """Testes para GET /health."""

    @pytest.fixture
    async def client(self) -> AsyncClient:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c

    async def test_health_endpoint_should_return_200(self, client: AsyncClient) -> None:
        """GET /health retorna 200 com status ok."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    async def test_docs_endpoint_should_return_200(self, client: AsyncClient) -> None:
        """GET /docs retorna 200 (Swagger UI)."""
        response = await client.get("/docs")
        assert response.status_code == 200
