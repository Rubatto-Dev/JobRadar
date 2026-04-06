"""Testes para RemotiveAdapter com mock HTTP via respx."""

from __future__ import annotations

import httpx
import pytest
import respx

from src.adapters.remotive import RemotiveAdapter


@pytest.fixture
def adapter() -> RemotiveAdapter:
    return RemotiveAdapter()


SAMPLE_JOB = {
    "id": 99,
    "title": "Backend Developer",
    "company_name": "RemoteCo",
    "description": "<p>We are looking for a <strong>backend dev</strong>.</p>",
    "candidate_required_location": "Worldwide",
    "salary": "USD 80k-120k",
    "url": "https://remotive.com/job/99",
    "publication_date": "2026-04-01T12:00:00",
}


class TestRemotiveAdapter:
    @respx.mock
    async def test_remotive_adapter_should_map_fields_correctly(self, adapter: RemotiveAdapter) -> None:
        respx.get("https://remotive.com/api/remote-jobs").mock(
            return_value=httpx.Response(200, json={"jobs": [SAMPLE_JOB]})
        )
        jobs = await adapter.collect({})
        assert len(jobs) == 1
        assert jobs[0].title == "Backend Developer"
        assert jobs[0].company == "RemoteCo"
        assert jobs[0].modality == "remoto"
        assert jobs[0].salary_text == "USD 80k-120k"
        assert jobs[0].external_id == "99"

    @respx.mock
    async def test_remotive_adapter_should_strip_html_from_description(self, adapter: RemotiveAdapter) -> None:
        respx.get("https://remotive.com/api/remote-jobs").mock(
            return_value=httpx.Response(200, json={"jobs": [SAMPLE_JOB]})
        )
        jobs = await adapter.collect({})
        assert "<p>" not in jobs[0].description
        assert "<strong>" not in jobs[0].description
        assert "backend dev" in jobs[0].description

    @respx.mock
    async def test_remotive_adapter_should_handle_empty_response(self, adapter: RemotiveAdapter) -> None:
        respx.get("https://remotive.com/api/remote-jobs").mock(return_value=httpx.Response(200, json={"jobs": []}))
        jobs = await adapter.collect({})
        assert len(jobs) == 0

    @respx.mock
    async def test_remotive_adapter_should_handle_network_error(self, adapter: RemotiveAdapter) -> None:
        respx.get("https://remotive.com/api/remote-jobs").mock(side_effect=httpx.ConnectError("timeout"))
        jobs = await adapter.collect({})
        assert len(jobs) == 0
