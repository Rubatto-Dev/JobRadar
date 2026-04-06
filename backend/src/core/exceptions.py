class DomainError(Exception):
    def __init__(self, message: str = "Domain error") -> None:
        self.message = message
        super().__init__(self.message)


class InvalidCredentialsError(DomainError):
    def __init__(self) -> None:
        super().__init__("Invalid email or password")


class EmailAlreadyExistsError(DomainError):
    def __init__(self) -> None:
        super().__init__("Email already registered")


class WeakPasswordError(DomainError):
    def __init__(self, reason: str = "Password does not meet requirements") -> None:
        super().__init__(reason)


class EmailNotVerifiedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Email not verified")


class AccountDeactivatedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Account is deactivated")


class InvalidTokenError(DomainError):
    def __init__(self, reason: str = "Invalid or expired token") -> None:
        super().__init__(reason)


class TokenBlacklistedError(DomainError):
    def __init__(self) -> None:
        super().__init__("Token has been revoked")


class LGPDConsentRequiredError(DomainError):
    def __init__(self) -> None:
        super().__init__("LGPD consent is required")


class RateLimitExceededError(DomainError):
    def __init__(self, retry_after: int = 60) -> None:
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Retry after {retry_after} seconds")
