from __future__ import annotations

import re
import unicodedata
from typing import Any, Protocol
from uuid import UUID

from src.schemas.area import AreaCreate, AreaResponse, AreaUpdate


class AreaRepositoryProtocol(Protocol):
    async def list_active(self) -> list[Any]: ...
    async def create(self, **kwargs: Any) -> Any: ...
    async def update(self, area_id: UUID, **kwargs: Any) -> Any: ...


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower().strip())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


class AreaService:
    def __init__(self, repo: AreaRepositoryProtocol) -> None:
        self._repo = repo

    async def list_active(self, locale: str = "pt-br") -> list[AreaResponse]:
        areas = await self._repo.list_active()
        result = []
        for area in areas:
            name = area.name_pt if locale == "pt-br" else (area.name_en or area.name_pt)
            result.append(
                AreaResponse(
                    id=area.id,
                    name=name,
                    slug=area.slug,
                    is_active=area.is_active,
                )
            )
        return result

    async def create(self, data: AreaCreate) -> AreaResponse:
        slug = _slugify(data.name_pt)
        area = await self._repo.create(
            name_pt=data.name_pt,
            name_en=data.name_en,
            slug=slug,
        )
        return AreaResponse(
            id=area.id,
            name=area.name_pt,
            slug=area.slug,
            is_active=area.is_active,
        )

    async def update(self, area_id: UUID, data: AreaUpdate) -> AreaResponse:
        update_data = data.model_dump(exclude_unset=True)
        if "name_pt" in update_data:
            update_data["slug"] = _slugify(update_data["name_pt"])
        area = await self._repo.update(area_id, **update_data)
        return AreaResponse(
            id=area.id,
            name=area.name_pt,
            slug=area.slug,
            is_active=area.is_active,
        )
