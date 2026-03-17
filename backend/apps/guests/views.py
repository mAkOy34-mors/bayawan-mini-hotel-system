"""
apps/guests/views.py

GET    /api/v1/guests/my-profile       → fetch own profile
POST   /api/v1/guests/complete-profile → create profile
PUT    /api/v1/guests/complete-profile → update profile
DELETE /api/v1/guests/my-profile       → delete profile
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GuestInformation
from .serializers import GuestInformationSerializer

logger = logging.getLogger(__name__)


class MyProfileView(APIView):
    """GET / DELETE for the authenticated user's profile."""

    def get(self, request):
        try:
            profile = GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(None, status=status.HTTP_404_NOT_FOUND)

        return Response(GuestInformationSerializer(profile).data)

    def delete(self, request):
        try:
            profile = GuestInformation.objects.get(user=request.user)
            profile.delete()
        except GuestInformation.DoesNotExist:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)


class CompleteProfileView(APIView):
    """POST (create) / PUT (update) the authenticated user's profile."""

    def post(self, request):
        if GuestInformation.objects.filter(user=request.user).exists():
            return Response(
                {"message": "Profile already exists. Use PUT to update."},
                status=status.HTTP_409_CONFLICT,
            )

        ser = GuestInformationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        profile = ser.save(user=request.user)
        logger.info("Guest profile created for user %s", request.user.id)
        return Response(GuestInformationSerializer(profile).data, status=status.HTTP_201_CREATED)

    def put(self, request):
        try:
            profile = GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(
                {"message": "Profile not found. Use POST to create one."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ser = GuestInformationSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        profile = ser.save()
        return Response(GuestInformationSerializer(profile).data)