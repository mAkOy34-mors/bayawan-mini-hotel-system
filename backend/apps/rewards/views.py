"""
apps/rewards/views.py

GET  /api/v1/rewards/my-points         → guest's own balance
GET  /api/v1/rewards/my-history        → guest's points history
GET  /api/v1/rewards/promotions        → active promotions

Admin only:
GET  /api/v1/rewards/                  → all guest balances
POST /api/v1/rewards/<user_pk>/adjust/ → adjust guest points
GET/POST /api/v1/rewards/rules/        → reward rules CRUD
POST /api/v1/rewards/promotions/create/→ create promotion
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GuestReward, RewardHistory, RewardRule, Promotion
from .serializers import (
    AdjustPointsSerializer, GuestRewardSerializer,
    PromotionSerializer, RewardHistorySerializer, RewardRuleSerializer,
)
from apps.users.models import User


def is_admin(user):
    return getattr(user, "role", None) == "ADMIN" or user.is_staff


# ── Guest endpoints ───────────────────────────────────────────────────────────

class MyPointsView(APIView):
    """GET /api/v1/rewards/my-points"""

    def get(self, request):
        reward, _ = GuestReward.objects.get_or_create(user=request.user)
        return Response(GuestRewardSerializer(reward).data)


class MyRewardHistoryView(APIView):
    """GET /api/v1/rewards/my-history"""

    def get(self, request):
        history = RewardHistory.objects.filter(user=request.user)
        return Response(RewardHistorySerializer(history, many=True).data)


class ActivePromotionsView(APIView):
    """GET /api/v1/rewards/promotions"""

    def get(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        promos = Promotion.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )
        return Response(PromotionSerializer(promos, many=True).data)


# ── Admin endpoints ───────────────────────────────────────────────────────────

class AllRewardsView(APIView):
    """GET /api/v1/rewards/ — admin only"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)
        rewards = GuestReward.objects.select_related("user").order_by("-points")
        return Response(GuestRewardSerializer(rewards, many=True).data)


class AdjustPointsView(APIView):
    """POST /api/v1/rewards/<user_pk>/adjust/ — admin only"""

    def post(self, request, user_pk):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        ser = AdjustPointsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            return Response({"message": "User not found."}, status=404)

        reward, _ = GuestReward.objects.get_or_create(user=user)
        reward.points += d["points"]
        if d["points"] > 0:
            reward.total_earned += d["points"]
        reward.save()

        RewardHistory.objects.create(
            user=user,
            points=d["points"],
            tx_type=RewardHistory.TxType.ADJUST,
            description=d["reason"],
        )

        return Response({
            "message":      f"Adjusted {d['points']:+} points for {user.email}.",
            "currentPoints": reward.points,
        })


class RewardRulesView(APIView):
    """GET/POST /api/v1/rewards/rules/ — admin only"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)
        return Response(RewardRuleSerializer(RewardRule.objects.all(), many=True).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)
        ser = RewardRuleSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class PromotionCreateView(APIView):
    """POST /api/v1/rewards/promotions/create/ — admin only"""

    def post(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)
        ser = PromotionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)
