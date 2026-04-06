from __future__ import annotations

import re

_MODALITY_MAP: dict[str, str] = {
    "remote": "remoto",
    "remoto": "remoto",
    "home office": "home_office",
    "home_office": "home_office",
    "homeoffice": "home_office",
    "hybrid": "hibrido",
    "hibrido": "hibrido",
    "híbrido": "hibrido",
    "on-site": "presencial",
    "onsite": "presencial",
    "presencial": "presencial",
    "freelance": "freelance",
    "freelancer": "freelance",
    "pj": "freelance",
}

_SENIORITY_MAP: dict[str, str] = {
    "intern": "estagio",
    "internship": "estagio",
    "estagio": "estagio",
    "estágio": "estagio",
    "estagiário": "estagio",
    "junior": "junior",
    "júnior": "junior",
    "jr": "junior",
    "mid": "pleno",
    "mid-level": "pleno",
    "pleno": "pleno",
    "senior": "senior",
    "sênior": "senior",
    "sr": "senior",
    "lead": "especialista",
    "specialist": "especialista",
    "especialista": "especialista",
    "principal": "especialista",
    "staff": "especialista",
    "manager": "gestao",
    "management": "gestao",
    "gestao": "gestao",
    "gestão": "gestao",
    "head": "gestao",
    "director": "gestao",
    "diretor": "gestao",
}

_SALARY_PATTERN = re.compile(r"[\d.,]+")


class NormalizationService:
    def normalize_modality(self, raw: str | None) -> str | None:
        if not raw:
            return None
        return _MODALITY_MAP.get(raw.lower().strip())

    def normalize_seniority(self, raw: str | None) -> str | None:
        if not raw:
            return None
        return _SENIORITY_MAP.get(raw.lower().strip())

    def normalize_salary(self, raw: str | None) -> tuple[int | None, int | None, str | None]:
        if not raw:
            return None, None, None
        numbers = _SALARY_PATTERN.findall(raw)
        parsed = []
        for n in numbers:
            clean = n.replace(".", "").replace(",", "")
            if clean.isdigit():
                val = int(clean)
                if val < 1000 and ("k" in raw.lower()):
                    val *= 1000
                parsed.append(val * 100)  # Store in cents

        salary_min = parsed[0] if len(parsed) >= 1 else None
        salary_max = parsed[1] if len(parsed) >= 2 else salary_min
        return salary_min, salary_max, raw.strip()

    def normalize_location(self, raw: str | None) -> tuple[str | None, str | None, str | None]:
        if not raw:
            return None, None, None
        parts = [p.strip() for p in raw.split(",")]
        city = parts[0] if len(parts) >= 1 else None
        state = parts[1] if len(parts) >= 2 else None
        country = parts[2] if len(parts) >= 3 else None
        return city, state, country

    def sanitize_html(self, html: str) -> str:
        text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()
