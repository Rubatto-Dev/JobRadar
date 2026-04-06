"""Testes unitarios para definicao dos modelos ORM."""

from sqlalchemy import inspect

from src.models.alert_log import AlertLog
from src.models.application import Application
from src.models.area import Area
from src.models.base import Base
from src.models.favorite import Favorite
from src.models.job import Job
from src.models.job_source import JobSource
from src.models.preference import UserPreference
from src.models.search_history import SearchHistory
from src.models.user import User


class TestModelDefinitions:
    """Testes para verificar definicao correta dos modelos."""

    def test_user_model_should_have_correct_table_name(self) -> None:
        assert User.__tablename__ == "users"

    def test_job_model_should_have_correct_table_name(self) -> None:
        assert Job.__tablename__ == "jobs"

    def test_job_source_model_should_have_correct_table_name(self) -> None:
        assert JobSource.__tablename__ == "job_sources"

    def test_all_models_should_have_uuid_primary_key(self) -> None:
        models = [User, Job, JobSource, UserPreference, Area, Favorite, Application, SearchHistory, AlertLog]
        for model in models:
            mapper = inspect(model)
            pk_cols = mapper.primary_key
            assert len(pk_cols) == 1, f"{model.__name__} should have exactly 1 PK"
            assert "UUID" in pk_cols[0].type.__class__.__name__, f"{model.__name__} PK should be UUID"

    def test_job_model_should_have_search_vector_column(self) -> None:
        mapper = inspect(Job)
        columns = {c.key for c in mapper.columns}
        assert "search_vector" in columns

    def test_user_model_should_have_all_required_columns(self) -> None:
        mapper = inspect(User)
        columns = {c.key for c in mapper.columns}
        required = {
            "id",
            "email",
            "name",
            "password_hash",
            "avatar_url",
            "location",
            "locale",
            "is_active",
            "is_admin",
            "email_verified",
            "lgpd_consent_at",
            "google_id",
            "created_at",
            "updated_at",
        }
        assert required.issubset(columns), f"Missing columns: {required - columns}"

    def test_job_model_should_have_all_required_columns(self) -> None:
        mapper = inspect(Job)
        columns = {c.key for c in mapper.columns}
        required = {
            "id",
            "external_id",
            "source_id",
            "title",
            "company",
            "description",
            "requirements",
            "location",
            "city",
            "state",
            "country",
            "modality",
            "seniority",
            "salary_min",
            "salary_max",
            "salary_text",
            "url",
            "published_at",
            "expires_at",
            "is_active",
            "raw_data",
            "fingerprint",
            "search_vector",
            "created_at",
            "updated_at",
        }
        assert required.issubset(columns), f"Missing columns: {required - columns}"

    def test_favorite_should_have_unique_constraint_user_job(self) -> None:
        table = Favorite.__table__
        unique_constraints = [c for c in table.constraints if hasattr(c, "columns") and len(c.columns) == 2]
        col_sets = [{col.name for col in c.columns} for c in unique_constraints]
        assert {"user_id", "job_id"} in col_sets

    def test_application_should_have_unique_constraint_user_job(self) -> None:
        table = Application.__table__
        unique_constraints = [c for c in table.constraints if hasattr(c, "columns") and len(c.columns) == 2]
        col_sets = [{col.name for col in c.columns} for c in unique_constraints]
        assert {"user_id", "job_id"} in col_sets

    def test_all_models_registered_in_base_metadata(self) -> None:
        expected_tables = {
            "users",
            "jobs",
            "job_sources",
            "user_preferences",
            "areas",
            "user_preference_areas",
            "favorites",
            "applications",
            "search_history",
            "alert_logs",
        }
        actual_tables = set(Base.metadata.tables.keys())
        assert expected_tables.issubset(actual_tables), f"Missing: {expected_tables - actual_tables}"
