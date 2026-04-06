from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from src.schemas.preference import PreferenceResponse, PreferenceUpdate


class PreferenceRepoProtocol(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> Any: ...
    async def create(self, **kwargs: Any) -> Any: ...
    async def update(self, pref_id: UUID, **kwargs: Any) -> Any: ...


class AreaRepoProtocol(Protocol):
    async def list_active(self) -> list[Any]: ...


class PreferenceService:
    def __init__(self, pref_repo: PreferenceRepoProtocol, area_repo: AreaRepoProtocol) -> None:
        self._pref_repo = pref_repo
        self._area_repo = area_repo

    async def get(self, user_id: UUID) -> PreferenceResponse:
        pref = await self._pref_repo.get_by_user_id(user_id)
        if pref is None:
            return PreferenceResponse()
        return PreferenceResponse(
            id=pref.id,
            modalities=pref.modalities or [],
            locations=pref.locations or [],
            seniority_levels=pref.seniority_levels or [],
            keywords=pref.keywords or [],
            salary_min=pref.salary_min,
            salary_max=pref.salary_max,
            alert_frequency=pref.alert_frequency,
            alerts_enabled=pref.alerts_enabled,
        )

    async def upsert(self, user_id: UUID, data: PreferenceUpdate) -> PreferenceResponse:
        if data.area_ids is not None:
            active_areas = await self._area_repo.list_active()
            active_ids = {a.id for a in active_areas}
            invalid = [aid for aid in data.area_ids if aid not in active_ids]
            if invalid:
                msg = f"Invalid area IDs: {invalid}"
                raise ValueError(msg)

        update_data = data.model_dump(exclude_unset=True, exclude={"area_ids"})
        existing = await self._pref_repo.get_by_user_id(user_id)

        if existing is None:
            await self._pref_repo.create(user_id=user_id, **update_data)
        else:
            await self._pref_repo.update(existing.id, **update_data)

        return await self.get(user_id)
