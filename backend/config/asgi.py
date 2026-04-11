# config/asgi.py
import os
from django.core.asgi import get_asgi_application

# This must be called before any other imports that use Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application first
django_asgi_app = get_asgi_application()

# Now import Django-dependent modules
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

# Import consumers (must come after Django initialization)
from apps.emergency.consumers import EmergencyConsumer

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/emergency/", EmergencyConsumer.as_asgi()),
        ])
    ),
})