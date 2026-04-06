"""Testes unitarios para core/security.py."""

from __future__ import annotations

import uuid

from src.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestSecurity:
    def test_hash_password_should_return_bcrypt_hash(self) -> None:
        hashed = hash_password("TestPass1")
        assert hashed.startswith("$2b$")
        assert hashed != "TestPass1"

    def test_verify_password_should_return_true_for_correct(self) -> None:
        hashed = hash_password("TestPass1")
        assert verify_password("TestPass1", hashed) is True

    def test_verify_password_should_return_false_for_wrong(self) -> None:
        hashed = hash_password("TestPass1")
        assert verify_password("WrongPass1", hashed) is False

    def test_jwt_should_use_hs256_algorithm(self) -> None:
        token = create_access_token(uuid.uuid4())
        # Decode header to check algorithm
        from jose import jwt

        header = jwt.get_unverified_header(token)
        assert header["alg"] == "HS256"

    def test_decode_token_should_return_claims(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        claims = decode_token(token)
        assert claims["sub"] == str(user_id)
        assert claims["type"] == "access"
