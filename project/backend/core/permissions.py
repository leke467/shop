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


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission check: allow read-only access to anyone, but only allow
    write access (update/delete) to the owner of the object.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.owner == request.user
