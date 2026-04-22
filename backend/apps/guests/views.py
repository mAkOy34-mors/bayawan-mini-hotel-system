"""
apps/guests/views.py

GET    /api/v1/guests/my-profile       → fetch own profile
POST   /api/v1/guests/complete-profile → create profile
PUT    /api/v1/guests/complete-profile → update profile
DELETE /api/v1/guests/my-profile       → delete profile
"""

import logging

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GuestInformation, GuestProfilePicture
from .serializers import GuestInformationSerializer, ProfilePictureSerializer

logger = logging.getLogger(__name__)


def _profile_cache_key(user_id):
    return f"guest_profile_{user_id}"


class MyProfileView(APIView):
    """GET / DELETE for the authenticated user's profile."""

    def get(self, request):
        cache_key = _profile_cache_key(request.user.id)
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            profile = GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(None, status=status.HTTP_404_NOT_FOUND)

        data = GuestInformationSerializer(profile).data
        cache.set(cache_key, data, timeout=300)  # 5 minutes
        return Response(data)

    def delete(self, request):
        try:
            profile = GuestInformation.objects.get(user=request.user)
            profile.delete()
        except GuestInformation.DoesNotExist:
            pass

        cache.delete(_profile_cache_key(request.user.id))
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

        data = GuestInformationSerializer(profile).data
        cache.set(_profile_cache_key(request.user.id), data, timeout=300)

        logger.info("Guest profile created for user %s", request.user.id)
        return Response(data, status=status.HTTP_201_CREATED)

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

        data = GuestInformationSerializer(profile).data
        cache.set(_profile_cache_key(request.user.id), data, timeout=300)

        logger.info("Guest profile updated for user %s", request.user.id)
        return Response(data)

class ProfilePictureView(APIView):
    """GET / POST (upsert) the user's profile picture."""

    def get(self, request):
        try:
            pic = GuestProfilePicture.objects.get(user=request.user)
            return Response(ProfilePictureSerializer(pic).data)
        except GuestProfilePicture.DoesNotExist:
            return Response(None, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        image_base64 = request.data.get("imageBase64")
        if not image_base64:
            return Response({"error": "imageBase64 is required."}, status=status.HTTP_400_BAD_REQUEST)

        pic, _ = GuestProfilePicture.objects.update_or_create(
            user=request.user,
            defaults={"image_base64": image_base64},
        )
        return Response(ProfilePictureSerializer(pic).data)