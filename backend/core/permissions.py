"""Custom DRF permissions for enterprise role-based access control (RBAC)."""

from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Allows access only to Admin users or superusers."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.is_staff
                or request.user.groups.filter(name="Admin").exists()
            )
        )


class IsSecurityOfficer(permissions.BasePermission):
    """Allows access to Security Officers or Admins."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.is_staff
                or request.user.groups.filter(name__in=["Admin", "Security Officer"]).exists()
            )
        )


# Alias for clarity
IsAdminOrSecurityOfficer = IsSecurityOfficer



class IsLabIncharge(permissions.BasePermission):
    """Allows access to Lab Incharge users, Security Officers, or Admins."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.is_staff
                or request.user.groups.filter(name__in=["Admin", "Security Officer", "Lab Incharge"]).exists()
            )
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allows write access to Admin users, read-only access to authenticated users."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.is_staff
                or request.user.groups.filter(name="Admin").exists()
            )
        )
