"""Testes unitarios para AreaService."""

from __future__ import annotations

from src.schemas.area import AreaCreate
from src.services.area_service import AreaService
from tests.fakes import FakeArea, FakeAreaRepository


def _make_service(areas: list[FakeArea] | None = None) -> AreaService:
    return AreaService(FakeAreaRepository(areas))


class TestListAreas:
    async def test_list_areas_should_return_active_only(self) -> None:
        areas = [
            FakeArea(name_pt="Tecnologia", name_en="Technology", is_active=True),
            FakeArea(name_pt="Saude", name_en="Health", is_active=False),
            FakeArea(name_pt="Financas", name_en="Finance", is_active=True),
        ]
        service = _make_service(areas)
        result = await service.list_active("pt-br")
        assert len(result) == 2
        names = {a.name for a in result}
        assert "Tecnologia" in names
        assert "Financas" in names
        assert "Saude" not in names

    async def test_list_areas_should_return_localized_name_en(self) -> None:
        areas = [FakeArea(name_pt="Tecnologia", name_en="Technology", is_active=True)]
        service = _make_service(areas)
        result = await service.list_active("en")
        assert result[0].name == "Technology"

    async def test_list_areas_should_fallback_to_pt_when_no_en(self) -> None:
        areas = [FakeArea(name_pt="Tecnologia", name_en=None, is_active=True)]
        service = _make_service(areas)
        result = await service.list_active("en")
        assert result[0].name == "Tecnologia"


class TestCreateArea:
    async def test_create_area_should_generate_slug(self) -> None:
        service = _make_service()
        data = AreaCreate(name_pt="Engenharia de Software", name_en="Software Engineering")
        result = await service.create(data)
        assert result.slug == "engenharia-de-software"
        assert result.name == "Engenharia de Software"

    async def test_create_area_slug_should_handle_accents(self) -> None:
        service = _make_service()
        data = AreaCreate(name_pt="Administração e Finanças")
        result = await service.create(data)
        assert result.slug == "administracao-e-financas"
