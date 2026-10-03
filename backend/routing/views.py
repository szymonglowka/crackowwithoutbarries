# OWNER: Agent A2 (routing). See docs/agents/A2-routing.md and docs/API.md#route
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def route(request):
    return Response({"detail": "Routing not implemented yet"}, status=501)
