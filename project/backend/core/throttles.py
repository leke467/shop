"""Custom DRF throttle classes for sensitive endpoints."""
from __future__ import annotations

from rest_framework.throttling import ScopedRateThrottle


class ScopedThrottle(ScopedRateThrottle):
    """
    Applies per-view throttle rates defined in settings.DEFAULT_THROTTLE_RATES.

    Usage: set ``throttle_scope = "auth"`` on a view to apply the ``auth`` rate.

    Pre-configured scopes in base settings:
        - ``auth``: 10/min (login, register, password reset)
        - ``checkout``: 20/min (payment, order creation)

    The global anon/user throttles (60/min, 240/min) apply to all endpoints
    on top of any scoped throttle.
    """
    pass
