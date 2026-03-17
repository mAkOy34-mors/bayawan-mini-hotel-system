"""apps/rewards/serializers.py"""
from rest_framework import serializers
from .models import GuestReward, RewardHistory, RewardRule, Promotion


class RewardRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RewardRule
        fields = "__all__"


class GuestRewardSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = GuestReward
        fields = ["id", "email", "points", "total_earned", "updated_at"]


class RewardHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = RewardHistory
        fields = ["id", "points", "tx_type", "description", "created_at"]


class AdjustPointsSerializer(serializers.Serializer):
    points = serializers.IntegerField()
    reason = serializers.CharField(max_length=255, default="Manual adjustment")


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Promotion
        fields = "__all__"
