"""Testes unitarios para core/i18n.py."""

from __future__ import annotations

from src.core.i18n import get_locale_from_header, t


class TestTranslation:
    def test_t_should_return_pt_br_by_default(self) -> None:
        result = t("errors.invalid_credentials")
        assert "inválidos" in result.lower() or "invalidos" in result.lower()

    def test_t_should_return_en_when_locale_en(self) -> None:
        result = t("errors.invalid_credentials", locale="en")
        assert "invalid" in result.lower()

    def test_t_should_interpolate_kwargs(self) -> None:
        result = t("errors.rate_limit_exceeded", locale="en", retry_after=60)
        assert "60" in result


class TestLocaleDetection:
    def test_should_return_pt_br_when_no_header(self) -> None:
        assert get_locale_from_header(None) == "pt-br"

    def test_should_return_en_when_header_en(self) -> None:
        assert get_locale_from_header("en-US,en;q=0.9") == "en"

    def test_should_return_pt_br_when_header_pt(self) -> None:
        assert get_locale_from_header("pt-BR,pt;q=0.9") == "pt-br"

    def test_should_return_pt_br_for_unknown_language(self) -> None:
        assert get_locale_from_header("fr-FR") == "pt-br"
