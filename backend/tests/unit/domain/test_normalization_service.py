"""Testes unitarios para NormalizationService."""

from __future__ import annotations

import pytest

from src.services.normalization_service import NormalizationService


@pytest.fixture
def svc() -> NormalizationService:
    return NormalizationService()


class TestNormalizeModality:
    def test_normalize_modality_should_map_variations(self, svc: NormalizationService) -> None:
        assert svc.normalize_modality("remote") == "remoto"
        assert svc.normalize_modality("Remote") == "remoto"
        assert svc.normalize_modality("hybrid") == "hibrido"
        assert svc.normalize_modality("on-site") == "presencial"
        assert svc.normalize_modality("home office") == "home_office"
        assert svc.normalize_modality("freelance") == "freelance"
        assert svc.normalize_modality("PJ") == "freelance"

    def test_normalize_modality_should_return_none_for_unknown(self, svc: NormalizationService) -> None:
        assert svc.normalize_modality("xpto") is None
        assert svc.normalize_modality(None) is None
        assert svc.normalize_modality("") is None


class TestNormalizeSeniority:
    def test_normalize_seniority_should_map_pt_and_en(self, svc: NormalizationService) -> None:
        assert svc.normalize_seniority("junior") == "junior"
        assert svc.normalize_seniority("Jr") == "junior"
        assert svc.normalize_seniority("Senior") == "senior"
        assert svc.normalize_seniority("Sr") == "senior"
        assert svc.normalize_seniority("intern") == "estagio"
        assert svc.normalize_seniority("estágio") == "estagio"
        assert svc.normalize_seniority("pleno") == "pleno"
        assert svc.normalize_seniority("mid-level") == "pleno"
        assert svc.normalize_seniority("manager") == "gestao"
        assert svc.normalize_seniority("lead") == "especialista"

    def test_normalize_seniority_should_return_none_for_unknown(self, svc: NormalizationService) -> None:
        assert svc.normalize_seniority(None) is None
        assert svc.normalize_seniority("xpto") is None


class TestNormalizeSalary:
    def test_normalize_salary_should_parse_ranges(self, svc: NormalizationService) -> None:
        sal_min, sal_max, text = svc.normalize_salary("R$ 5000 - 8000")
        assert sal_min == 500000
        assert sal_max == 800000
        assert text == "R$ 5000 - 8000"

    def test_normalize_salary_should_parse_single_value(self, svc: NormalizationService) -> None:
        sal_min, sal_max, _ = svc.normalize_salary("R$ 3000")
        assert sal_min == 300000
        assert sal_max == 300000

    def test_normalize_salary_should_return_none_for_empty(self, svc: NormalizationService) -> None:
        assert svc.normalize_salary(None) == (None, None, None)
        assert svc.normalize_salary("") == (None, None, None)


class TestNormalizeLocation:
    def test_normalize_location_should_split_parts(self, svc: NormalizationService) -> None:
        city, state, country = svc.normalize_location("Sao Paulo, SP, Brasil")
        assert city == "Sao Paulo"
        assert state == "SP"
        assert country == "Brasil"

    def test_normalize_location_should_handle_partial(self, svc: NormalizationService) -> None:
        city, state, country = svc.normalize_location("Remote")
        assert city == "Remote"
        assert state is None
        assert country is None


class TestSanitizeHtml:
    def test_sanitize_html_should_remove_tags(self, svc: NormalizationService) -> None:
        result = svc.sanitize_html("<p>Hello <b>world</b></p>")
        assert result == "Hello world"

    def test_sanitize_html_should_remove_scripts(self, svc: NormalizationService) -> None:
        result = svc.sanitize_html("<p>Hi</p><script>alert('xss')</script><p>there</p>")
        assert "script" not in result.lower()
        assert "alert" not in result
        assert "Hi" in result
        assert "there" in result

    def test_sanitize_html_should_remove_styles(self, svc: NormalizationService) -> None:
        result = svc.sanitize_html("<style>body{color:red}</style><p>text</p>")
        assert "style" not in result.lower()
        assert "text" in result
