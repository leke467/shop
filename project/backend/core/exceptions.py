"""Consistent API error envelope.

Every handled error returns::

    {"error": {"type": "...", "detail": ..., "status_code": 4xx}}

so the frontend can render failures uniformly. Unexpected exceptions are logged
and returned as a generic 500 without leaking internals.
"""
from __future__ import annotations

import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    # Subscription limit / feature errors carry structured upgrade context so
    # the frontend can render an "upgrade" prompt. Handled before the generic
    # branch so the extra fields survive into the response.
    #
    # Imported lazily to avoid an app-loading cycle at settings import time.
    try:
        from subscriptions.services import FeatureNotAvailable, LimitReached
    except Exception:  # pragma: no cover - subscriptions app may be absent
        FeatureNotAvailable = LimitReached = ()

    if LimitReached and isinstance(exc, LimitReached):
        rec = exc.recommended_plan
        return Response(
            {
                "error": {
                    "type": "LimitReached",
                    "detail": str(exc),
                    "status_code": 402,
                    "limit_type": exc.limit_type,
                    "limit": exc.limit,
                    "current": exc.current,
                    "recommended_plan": (
                        {"code": rec.code, "name": rec.name,
                         "monthly_price": str(rec.monthly_price)}
                        if rec else None
                    ),
                }
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    if FeatureNotAvailable and isinstance(exc, FeatureNotAvailable):
        rec = exc.recommended_plan
        return Response(
            {
                "error": {
                    "type": "FeatureNotAvailable",
                    "detail": str(exc),
                    "status_code": 403,
                    "feature": exc.feature,
                    "recommended_plan": (
                        {"code": rec.code, "name": rec.name,
                         "monthly_price": str(rec.monthly_price)}
                        if rec else None
                    ),
                }
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    response = drf_exception_handler(exc, context)

    if response is not None:

        response.data = {
            "error": {
                "type": exc.__class__.__name__,
                "detail": response.data,
                "status_code": response.status_code,
            }
        }
        return response

    # DRF did not recognise the exception -> normalise the common Django ones.
    if isinstance(exc, Http404):
        return Response(
            {"error": {"type": "NotFound", "detail": "Not found.",
                       "status_code": 404}},
            status=status.HTTP_404_NOT_FOUND,
        )
    if isinstance(exc, DjangoPermissionDenied):
        return Response(
            {"error": {"type": "PermissionDenied", "detail": "Permission denied.",
                       "status_code": 403}},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Truly unexpected -> log with stack trace, return opaque 500.
    logger.exception("Unhandled API exception", exc_info=exc)
    return Response(
        {"error": {"type": "ServerError",
                   "detail": "An unexpected error occurred.",
                   "status_code": 500}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
