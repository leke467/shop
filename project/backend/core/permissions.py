"""
Custom Security Permissions for Superadmin, Staff, Vendors, and Customers.
"""
from rest_framework import permissions


class IsSuperadminOrStaff(permissions.BasePermission):
    """
    Permission check: allow access to Superadmin, Staff, or Admin users.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_staff or
                user.is_superuser or
                getattr(user, "role", None) in ["admin", "staff"]
            )
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow read access to anyone, but write access only to owners.
    Supports objects with direct .owner, .shop.owner, or .user fields.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = getattr(obj, "owner", None)
        if owner is None and hasattr(obj, "shop"):
            owner = getattr(obj.shop, "owner", None)
        if owner is None and hasattr(obj, "user"):
            owner = getattr(obj, "user", None)
        return bool(owner and owner == request.user)


class IsSuperadminOnly(permissions.BasePermission):
    """
    Permission check: allow access ONLY to Superadmin / Admin role users.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or
                getattr(user, "role", None) == "admin"
            )
        )
