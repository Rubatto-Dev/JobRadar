from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

_TRANSLATIONS_DIR = Path(__file__).parent.parent / "i18n"
_translations: dict[str, dict[str, Any]] = {}


def _load_translations() -> None:
    if _translations:
        return
    for yml_file in _TRANSLATIONS_DIR.glob("*.yml"):
        with yml_file.open(encoding="utf-8") as f:
            data = yaml.safe_load(f)
            if isinstance(data, dict):
                _translations.update(data)


def t(key: str, locale: str = "pt-br", **kwargs: Any) -> str:
    _load_translations()
    keys = key.split(".")
    value: Any = _translations.get(locale, {})
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            break

    if value is None:
        # Fallback to en
        value = _translations.get("en", {})
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                break

    if value is None:
        return key

    result = str(value)
    if kwargs:
        result = result.format(**kwargs)
    return result


def get_locale_from_header(accept_language: str | None) -> str:
    if not accept_language:
        return "pt-br"
    lang = accept_language.split(",")[0].strip().lower()
    if lang.startswith("en"):
        return "en"
    return "pt-br"
