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
    Supports objects with direct .owner, .shop.owner, .user fields, or reverse user.shops relation.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser or getattr(request.user, "role", None) in ["admin", "staff"]:
            return True

        # Check direct ownership on object
        owner = getattr(obj, "owner", None)
        if owner is not None:
            if owner == request.user or getattr(owner, "id", None) == getattr(request.user, "id", None) or getattr(owner, "pk", None) == getattr(request.user, "pk", None):
                return True

        # Check direct user attribute
        user_attr = getattr(obj, "user", None)
        if user_attr is not None:
            if user_attr == request.user or getattr(user_attr, "id", None) == getattr(request.user, "id", None) or getattr(user_attr, "pk", None) == getattr(request.user, "pk", None):
                return True

        # Check shop ownership (either obj is a Shop, or obj has a .shop relationship)
        shop = obj if hasattr(obj, "slug") and hasattr(obj, "owner") and not hasattr(obj, "shop") else getattr(obj, "shop", None)
        if shop is not None:
            shop_owner = getattr(shop, "owner", None)
            if shop_owner is not None:
                if shop_owner == request.user or getattr(shop_owner, "id", None) == getattr(request.user, "id", None) or getattr(shop_owner, "pk", None) == getattr(request.user, "pk", None):
                    return True
            if getattr(shop, "owner_id", None) == getattr(request.user, "id", None):
                return True
            # Also check if request.user has this shop in their owned shops
            if hasattr(request.user, "shops") and request.user.shops.filter(id=getattr(shop, "id", None)).exists():
                return True

        # Fallback: if user owns the shop containing this product
        shop_id = getattr(obj, "shop_id", None)
        if shop_id and hasattr(request.user, "shops"):
            if request.user.shops.filter(id=shop_id).exists():
                return True

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
