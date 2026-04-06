from __future__ import annotations

import uuid

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    lgpd_consent: bool
    locale: str = "pt-br"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v.strip()) < 3 or len(v.strip()) > 150:
            raise ValueError("Name must be between 3 and 150 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserBrief


class UserBrief(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_admin: bool
    locale: str


class RegisterResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    message: str = "Confirmation email sent"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class GoogleAuthRequest(BaseModel):
    credential: str


class MessageResponse(BaseModel):
    message: str
