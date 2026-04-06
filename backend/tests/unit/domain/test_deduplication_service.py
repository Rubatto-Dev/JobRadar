"""Testes unitarios para DeduplicationService e fingerprint."""

from __future__ import annotations

from src.protocols.job_source import generate_fingerprint
from src.services.deduplication_service import DeduplicationService
from tests.fakes import FakeJobRepository


class TestGenerateFingerprint:
    def test_generate_fingerprint_should_be_deterministic(self) -> None:
        fp1 = generate_fingerprint("Software Engineer", "Acme Corp", "Sao Paulo")
        fp2 = generate_fingerprint("Software Engineer", "Acme Corp", "Sao Paulo")
        assert fp1 == fp2
        assert len(fp1) == 64  # SHA256 hex

    def test_generate_fingerprint_should_ignore_case_and_accents(self) -> None:
        fp1 = generate_fingerprint("Engenheiro de Software", "Empresa São Paulo", "São Paulo")
        fp2 = generate_fingerprint("engenheiro de software", "empresa sao paulo", "sao paulo")
        assert fp1 == fp2

    def test_generate_fingerprint_should_differ_for_different_jobs(self) -> None:
        fp1 = generate_fingerprint("Software Engineer", "Acme", "SP")
        fp2 = generate_fingerprint("Data Scientist", "Acme", "SP")
        assert fp1 != fp2

    def test_generate_fingerprint_should_handle_none_location(self) -> None:
        fp = generate_fingerprint("Job", "Company", None)
        assert len(fp) == 64


class TestDeduplicationService:
    async def test_is_duplicate_should_return_false_for_new(self) -> None:
        repo = FakeJobRepository()
        svc = DeduplicationService(repo)
        assert await svc.is_duplicate("abc123") is False

    async def test_is_duplicate_should_return_true_for_existing(self) -> None:
        repo = FakeJobRepository()
        await repo.create(fingerprint="abc123")
        svc = DeduplicationService(repo)
        assert await svc.is_duplicate("abc123") is True
