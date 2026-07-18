"""
Custom domain service layer.

Owning a custom domain is a *subscription feature* (``custom_domain_enabled``),
so all entry points here go through :func:`subscriptions.services.assert_has_feature`
before mutating anything. Keeping the logic in one module means the views stay
thin and the DNS/verification rules live in a single, testable place.

The SaaS custom-domain flow modelled here
------------------------------------------
1. **Attach** — the owner submits a domain. We normalise + validate it, ensure
   it is not already claimed by another shop, generate a verification token and
   store everything with status ``PENDING``. We hand back the DNS records the
   owner must create.
2. **DNS** — the owner adds, at their DNS provider:
   * a ``CNAME`` record pointing their domain at the platform edge host, and
   * a ``TXT`` record at ``_shopverify.<domain>`` whose value is the token.
3. **Verify** — the owner triggers verification. We resolve the TXT record and,
   if it contains the token, flip the status to ``VERIFIED`` and stamp the time.
   The edge/proxy then routes requests for that Host to the shop's storefront.

DNS resolution uses ``dnspython`` when available; if it is not installed the
verification step raises a clear, actionable error rather than silently
passing. This keeps the feature safe by default.
"""
from __future__ import annotations

import re

from django.conf import settings
from django.utils import timezone

from subscriptions.services import assert_has_feature

from .models import Shop

# The platform edge host owners point their CNAME at. Overridable via settings
# so staging/prod can differ without code changes.
PLATFORM_EDGE_HOST = getattr(
    settings, "CUSTOM_DOMAIN_EDGE_HOST", "shops.myplatform.com"
)
# Subdomain label under which we look for the verification TXT record.
TXT_VERIFICATION_PREFIX = "_shopverify"

# A pragmatic hostname validator: labels of a-z0-9/hyphen, 1-63 chars each,
# 2+ labels, no leading/trailing dot. Not exhaustive but rejects obvious junk.
_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)"
    r"(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)


class DomainError(Exception):
    """Raised for invalid/duplicate domains or verification failures."""


def normalise_domain(raw: str) -> str:
    """Lower-case, strip scheme/path/port and surrounding whitespace.

    ``https://Shop.Example.com/`` -> ``shop.example.com``.
    """
    domain = (raw or "").strip().lower()
    # Drop scheme.
    domain = re.sub(r"^[a-z]+://", "", domain)
    # Drop any path, query, or port.
    domain = domain.split("/")[0].split("?")[0].split(":")[0]
    # Drop a trailing dot (FQDN form) and leading 'www.' is kept as-is (owner
    # choice) but a bare trailing dot is meaningless here.
    domain = domain.rstrip(".")
    return domain


def validate_domain(domain: str) -> None:
    if not domain or not _DOMAIN_RE.match(domain):
        raise DomainError(
            "Enter a valid domain like 'shop.example.com' (no http://, no path)."
        )
    # Disallow pointing at our own apex/edge to avoid loops.
    base = PLATFORM_EDGE_HOST.split(":")[0].lower()
    if domain == base or domain.endswith("." + base):
        raise DomainError("You cannot use a platform-owned domain.")


def dns_instructions(shop: Shop) -> dict:
    """Return the DNS records the owner must create, plus current status."""
    return {
        "domain": shop.custom_domain,
        "status": shop.custom_domain_status,
        "verified_at": shop.custom_domain_verified_at,
        "records": [
            {
                "type": "CNAME",
                "host": shop.custom_domain,
                "value": PLATFORM_EDGE_HOST,
                "ttl": 3600,
                "purpose": "Routes your domain's traffic to the platform.",
            },
            {
                "type": "TXT",
                "host": f"{TXT_VERIFICATION_PREFIX}.{shop.custom_domain}",
                "value": shop.custom_domain_verification_token,
                "ttl": 3600,
                "purpose": "Proves you own this domain.",
            },
        ],
    }


def attach_domain(shop: Shop, raw_domain: str) -> Shop:
    """Attach (or replace) a custom domain on ``shop`` and issue a token.

    Feature-gated. Sets the domain to ``PENDING`` and returns the shop; call
    :func:`dns_instructions` afterwards to show the records to add.
    """
    assert_has_feature(shop.owner, "custom_domain_enabled")

    domain = normalise_domain(raw_domain)
    validate_domain(domain)

    # Enforce global uniqueness across all shops (excluding this one).
    clash = (
        Shop.all_objects
        .filter(custom_domain=domain)
        .exclude(pk=shop.pk)
        .exists()
    )
    if clash:
        raise DomainError("That domain is already connected to another shop.")

    shop.custom_domain = domain
    shop.custom_domain_status = Shop.DomainStatus.PENDING
    shop.custom_domain_verification_token = Shop.generate_domain_token()
    shop.custom_domain_verified_at = None
    shop.save(update_fields=[
        "custom_domain",
        "custom_domain_status",
        "custom_domain_verification_token",
        "custom_domain_verified_at",
        "updated_at",
    ])
    return shop


def _resolve_txt(name: str) -> list[str]:
    """Resolve TXT records for ``name``. Raises DomainError if unavailable."""
    try:
        import dns.resolver  # type: ignore
    except ImportError as exc:  # pragma: no cover - depends on env
        raise DomainError(
            "DNS verification is not available on the server "
            "(missing 'dnspython'). Please contact support."
        ) from exc

    try:
        answers = dns.resolver.resolve(name, "TXT")
    except Exception as exc:
        raise DomainError(
            "Could not find the verification TXT record yet. DNS changes can "
            "take a while to propagate — try again shortly."
        ) from exc

    values: list[str] = []
    for rdata in answers:
        # Each TXT rdata may be split into chunks of quoted strings.
        raw = b"".join(getattr(rdata, "strings", [])) if hasattr(rdata, "strings") else str(rdata).encode()
        values.append(raw.decode(errors="ignore").strip().strip('"'))
    return values


def verify_domain(shop: Shop) -> Shop:
    """Verify domain ownership by resolving the TXT token record.

    Feature-gated. On success flips status to ``VERIFIED``; on failure marks
    ``FAILED`` and raises :class:`DomainError` with an actionable message.
    """
    assert_has_feature(shop.owner, "custom_domain_enabled")

    if not shop.custom_domain:
        raise DomainError("No custom domain is attached to this shop.")

    record_name = f"{TXT_VERIFICATION_PREFIX}.{shop.custom_domain}"
    token = shop.custom_domain_verification_token

    try:
        values = _resolve_txt(record_name)
    except DomainError:
        shop.custom_domain_status = Shop.DomainStatus.FAILED
        shop.save(update_fields=["custom_domain_status", "updated_at"])
        raise

    if token and token in values:
        shop.custom_domain_status = Shop.DomainStatus.VERIFIED
        shop.custom_domain_verified_at = timezone.now()
        shop.save(update_fields=[
            "custom_domain_status", "custom_domain_verified_at", "updated_at",
        ])
        return shop

    shop.custom_domain_status = Shop.DomainStatus.FAILED
    shop.save(update_fields=["custom_domain_status", "updated_at"])
    raise DomainError(
        "The verification TXT record was found but did not match. Double-check "
        "the value and try again once DNS has propagated."
    )


def remove_domain(shop: Shop) -> Shop:
    """Detach the custom domain and reset all related fields."""
    shop.custom_domain = ""
    shop.custom_domain_status = Shop.DomainStatus.NONE
    shop.custom_domain_verification_token = ""
    shop.custom_domain_verified_at = None
    shop.save(update_fields=[
        "custom_domain",
        "custom_domain_status",
        "custom_domain_verification_token",
        "custom_domain_verified_at",
        "updated_at",
    ])
    return shop
