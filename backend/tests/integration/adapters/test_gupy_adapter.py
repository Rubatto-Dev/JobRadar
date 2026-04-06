"""Testes para GupyAdapter com mock HTTP via respx."""

from __future__ import annotations

import httpx
import pytest
import respx

from src.adapters.gupy import GupyAdapter


@pytest.fixture
def adapter() -> GupyAdapter:
    return GupyAdapter()


SAMPLE_JOB = {
    "id": 12345,
    "name": "Software Engineer",
    "careerPageName": "Acme Corp",
    "description": "Build great software",
    "prerequisites": "Python experience",
    "city": "Sao Paulo",
    "state": "SP",
    "country": "Brasil",
    "workplaceType": "remote",
    "jobUrl": "https://acme.gupy.io/job/12345",
}


class TestGupyAdapter:
    @respx.mock
    async def test_gupy_adapter_should_map_fields_correctly(self, adapter: GupyAdapter) -> None:
        respx.get("https://portal.api.gupy.io/api/v1/jobs").mock(
            return_value=httpx.Response(200, json={"data": [SAMPLE_JOB]})
        )
        jobs = await adapter.collect({})
        assert len(jobs) == 1
        assert jobs[0].title == "Software Engineer"
        assert jobs[0].company == "Acme Corp"
        assert jobs[0].city == "Sao Paulo"
        assert jobs[0].modality == "remoto"
        assert jobs[0].external_id == "12345"

    @respx.mock
    async def test_gupy_adapter_should_paginate_all_results(self, adapter: GupyAdapter) -> None:
        page1 = [
            {"id": i, "name": f"Job {i}", "careerPageName": "Co", "description": "d", "jobUrl": "u"} for i in range(50)
        ]
        page2 = [{"id": 50, "name": "Job 50", "careerPageName": "Co", "description": "d", "jobUrl": "u"}]

        route = respx.get("https://portal.api.gupy.io/api/v1/jobs")
        route.side_effect = [
            httpx.Response(200, json={"data": page1}),
            httpx.Response(200, json={"data": page2}),
        ]
        jobs = await adapter.collect({})
        assert len(jobs) == 51

    @respx.mock
    async def test_gupy_adapter_should_handle_network_error(self, adapter: GupyAdapter) -> None:
        respx.get("https://portal.api.gupy.io/api/v1/jobs").mock(side_effect=httpx.ConnectError("timeout"))
        jobs = await adapter.collect({})
        assert len(jobs) == 0
