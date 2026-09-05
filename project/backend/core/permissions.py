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
    Object-level permission to allow read access to anyone, but write access only to owners or staff.
    Supports objects with direct .owner, .shop.owner, or .user fields.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser or getattr(request.user, "role", None) in ["admin", "staff"]:
            return True

        owner = getattr(obj, "owner", None)
        if owner is None and hasattr(obj, "shop") and obj.shop:
            owner = getattr(obj.shop, "owner", None)
            if owner is None and hasattr(obj.shop, "owner_id"):
                if obj.shop.owner_id == request.user.id:
                    return True
        if owner is None and hasattr(obj, "user") and obj.user:
            owner = getattr(obj, "user", None)
            if hasattr(obj, "user_id") and obj.user_id == request.user.id:
                return True

        if owner is not None:
            return bool(
                owner == request.user or
                getattr(owner, "id", None) == getattr(request.user, "id", None) or
                getattr(owner, "pk", None) == getattr(request.user, "pk", None)
            )
        return False


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
