import sys

import structlog


def setup_logging(*, debug: bool = False) -> None:
    shared_processors: list[structlog.types.Processor] = [
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    final: list[structlog.types.Processor]
    if debug and sys.stderr.isatty():
        final = [*shared_processors, structlog.dev.ConsoleRenderer()]
    else:
        final = [*shared_processors, structlog.processors.JSONRenderer()]

    structlog.configure(
        processors=final,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
