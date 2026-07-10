"""Reusable DRF permission classes."""
from __future__ import annotations

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level: safe methods for anyone, writes only for the owner.

    The owning user is resolved from ``owner_field`` (default ``owner``). Views
    may override the attribute name via ``owner_field`` on the view class.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner_field = getattr(view, "owner_field", "owner")
        owner = obj
        for part in owner_field.split("."):
            owner = getattr(owner, part, None)
        return owner is not None and owner == request.user


class IsSellerOrReadOnly(permissions.BasePermission):
    """Only authenticated sellers may perform write operations."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "is_seller", False)
        )


class IsBuyer(permissions.BasePermission):
    """Requires an authenticated buyer account."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated)
