from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import SiteTheme, THEME_PRESETS


@api_view(["GET"])
@permission_classes([AllowAny])
def active_theme(request):
    """
    Return the active site theme colors.

    Public endpoint – no authentication required. Cached aggressively
    on the frontend so it only fires once per page load.
    """
    theme = SiteTheme.objects.filter(is_active=True).first()

    if theme:
        colors = theme.get_colors()
        preset_name = theme.preset
    else:
        # Fallback to default if no theme exists
        default = THEME_PRESETS["teal_slate"]
        colors = {
            "primary": default["primary"],
            "secondary": default["secondary"],
            "accent": default["accent"],
        }
        preset_name = "teal_slate"

    return Response({
        "preset": preset_name,
        "colors": colors,
        "presets_available": {k: v["label"] for k, v in THEME_PRESETS.items()},
    })
