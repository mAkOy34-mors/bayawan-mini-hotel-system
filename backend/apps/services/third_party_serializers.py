# apps/services/third_party_serializers.py
from rest_framework import serializers
from .third_party_models import (
    ThirdPartyPartner, PartnerService, GuestPartnerRequest,
    CommissionPayment, CommissionPayout
)
from decimal import Decimal


class PartnerServiceSerializer(serializers.ModelSerializer):
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = PartnerService
        fields = ['id', 'name', 'description', 'price', 'duration_minutes', 'duration_display', 'is_available']

    def get_duration_display(self, obj):
        if not obj.duration_minutes:
            return None
        h, m = divmod(obj.duration_minutes, 60)
        if h and m:
            return f"{h}h {m}m"
        elif h:
            return f"{h}h"
        return f"{m}m"


class ThirdPartyPartnerSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    services = PartnerServiceSerializer(many=True, read_only=True)

    # New payout fields
    pending_payout = serializers.SerializerMethodField()
    total_paid_payout = serializers.SerializerMethodField()

    class Meta:
        model = ThirdPartyPartner
        fields = [
            'id', 'name', 'category', 'category_label', 'description', 'tagline',
            'contact_person', 'phone', 'email', 'website', 'address',
            'commission_rate', 'operating_hours', 'availability_notes',
            'logo_url', 'cover_image_url', 'average_rating', 'total_reviews',
            'status', 'status_label', 'is_featured', 'services', 'created_at',
            # New payout fields
            'payout_email', 'bank_account_name', 'bank_name',
            'bank_account_number', 'gcash_number',
            'pending_payout', 'total_paid_payout',
        ]
        read_only_fields = ['id', 'created_at']

    def get_pending_payout(self, obj):
        from django.db.models import Sum

        completed_requests = GuestPartnerRequest.objects.filter(
            partner=obj, status='COMPLETED', payment_status='PAID'
        )
        total_commission = completed_requests.aggregate(
            t=Sum('commission_amount')
        )['t'] or Decimal('0')

        paid_commission = CommissionPayout.objects.filter(
            partner=obj, status='COMPLETED'
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        return float(total_commission - paid_commission)

    def get_total_paid_payout(self, obj):
        from django.db.models import Sum

        paid_commission = CommissionPayout.objects.filter(
            partner=obj, status='COMPLETED'
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        return float(paid_commission)


class ThirdPartyPartnerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThirdPartyPartner
        fields = [
            'name', 'category', 'description', 'tagline',
            'contact_person', 'phone', 'email', 'website', 'address',
            'commission_rate', 'operating_hours', 'availability_notes',
            'logo_url', 'cover_image_url', 'status', 'is_featured', 'sort_order',
            # New payout fields
            'payout_email', 'bank_account_name', 'bank_name',
            'bank_account_number', 'gcash_number',
        ]


class GuestPartnerRequestSerializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source='partner.name', read_only=True)
    partner_category = serializers.CharField(source='partner.get_category_display', read_only=True)
    service_name = serializers.CharField(source='partner_service.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_label = serializers.CharField(source='get_payment_status_display', read_only=True)

    # New fields
    payment_method_display = serializers.SerializerMethodField()
    paid_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = GuestPartnerRequest
        fields = [
            'id', 'partner', 'partner_name', 'partner_category',
            'partner_service', 'service_name',
            'guest_name', 'guest_email', 'room_number',
            'notes', 'preferred_date', 'preferred_time', 'number_of_guests',
            'total_amount', 'commission_rate', 'commission_amount',
            'payment_status', 'payment_status_label',
            'payment_intent_id', 'payment_method_detail', 'payment_method_display',
            'paid_at', 'paid_at_formatted', 'receipt_number',
            'status', 'status_label',
            'created_at', 'updated_at', 'confirmed_at', 'completed_at',
        ]
        read_only_fields = ['id', 'guest_name', 'guest_email', 'commission_amount', 'created_at', 'updated_at']

    def get_payment_method_display(self, obj):
        if obj.payment_method_detail:
            return obj.payment_method_detail
        return '—'

    def get_paid_at_formatted(self, obj):
        if obj.paid_at:
            return obj.paid_at.strftime('%Y-%m-%d %H:%M:%S')
        return None


class CreateGuestPartnerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestPartnerRequest
        fields = [
            'partner', 'partner_service', 'room_number',
            'notes', 'preferred_date', 'preferred_time', 'number_of_guests', 'total_amount'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        partner = validated_data['partner']

        validated_data['guest'] = user
        validated_data['guest_name'] = user.username or user.email.split('@')[0]
        validated_data['guest_email'] = user.email
        validated_data['commission_rate'] = partner.commission_rate

        # If a specific service is chosen, set total_amount from it
        partner_service = validated_data.get('partner_service')
        if partner_service and not validated_data.get('total_amount'):
            validated_data['total_amount'] = partner_service.price

        return super().create(validated_data)


class CommissionPaymentSerializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source='partner.name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)

    class Meta:
        model = CommissionPayment
        fields = [
            'id', 'partner', 'partner_name', 'period_start', 'period_end',
            'total_bookings', 'gross_amount', 'commission_amount',
            'payment_method', 'reference_number', 'notes',
            'received_by_name', 'received_at',
        ]
        read_only_fields = ['id', 'received_at', 'received_by_name']


# =====================================================
# NEW SERIALIZERS FOR COMMISSION PAYOUT SYSTEM
# =====================================================

class CommissionPayoutSerializer(serializers.ModelSerializer):
    """Serializer for CommissionPayout model"""

    partner_name = serializers.CharField(source='partner.name', read_only=True)
    partner_category = serializers.CharField(source='partner.get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_label = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = CommissionPayout
        fields = [
            'id', 'partner', 'partner_name', 'partner_category',
            'amount', 'period_start', 'period_end',
            'status', 'status_label',
            'payment_method', 'payment_method_label',
            'payout_link', 'reference_number', 'notes',
            'paid_at', 'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'paid_at']


class CreateCommissionPayoutSerializer(serializers.ModelSerializer):
    """Serializer for creating a new commission payout"""

    class Meta:
        model = CommissionPayout
        fields = [
            'partner', 'amount', 'period_start', 'period_end',
            'payment_method', 'reference_number', 'notes',
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value

    def validate(self, data):
        from django.db.models import Sum

        partner = data.get('partner')
        amount = data.get('amount')

        # Check if amount doesn't exceed pending commission
        completed_requests = GuestPartnerRequest.objects.filter(
            partner=partner,
            status='COMPLETED',
            payment_status='PAID'
        )
        total_commission = completed_requests.aggregate(
            t=Sum('commission_amount')
        )['t'] or Decimal('0')

        paid_commission = CommissionPayout.objects.filter(
            partner=partner,
            status='COMPLETED'
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        pending_commission = total_commission - paid_commission

        if amount > pending_commission:
            raise serializers.ValidationError(
                f"Amount (₱{amount}) exceeds pending commission (₱{pending_commission})"
            )

        return data


class UpdateCommissionPayoutStatusSerializer(serializers.ModelSerializer):
    """Serializer for updating payout status"""

    class Meta:
        model = CommissionPayout
        fields = ['status', 'reference_number', 'notes', 'payout_link']

    def validate_status(self, value):
        valid_statuses = ['PENDING', 'COMPLETED', 'FAILED']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value


class PartnerPayoutSummarySerializer(serializers.Serializer):
    """Serializer for partner payout summary (not a model)"""

    id = serializers.IntegerField()
    name = serializers.CharField()
    category = serializers.CharField()
    payout_email = serializers.CharField(allow_null=True, required=False)
    bank_account_name = serializers.CharField(allow_null=True, required=False)
    bank_name = serializers.CharField(allow_null=True, required=False)
    bank_account_number = serializers.CharField(allow_null=True, required=False)
    gcash_number = serializers.CharField(allow_null=True, required=False)
    total_commission = serializers.FloatField()
    paid_commission = serializers.FloatField()
    pending_commission = serializers.FloatField()
    completed_requests_count = serializers.IntegerField()


class PayoutDashboardSerializer(serializers.Serializer):
    """Serializer for the payout dashboard data"""

    partners = PartnerPayoutSummarySerializer(many=True)
    payouts = CommissionPayoutSerializer(many=True)

    total_pending_payouts = serializers.SerializerMethodField()
    total_completed_payouts = serializers.SerializerMethodField()
    total_partners = serializers.SerializerMethodField()

    def get_total_pending_payouts(self, obj):
        partners = obj.get('partners', [])
        return sum(p.get('pending_commission', 0) for p in partners)

    def get_total_completed_payouts(self, obj):
        payouts = obj.get('payouts', [])
        return sum(p.amount for p in payouts if p.status == 'COMPLETED')

    def get_total_partners(self, obj):
        partners = obj.get('partners', [])
        return len(partners)


class CollectPaymentSerializer(serializers.Serializer):
    """Serializer for collecting payment from guest"""

    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    payment_method = serializers.ChoiceField(choices=['CASH', 'CARD', 'GCASH'])
    reference_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class ReceiptSerializer(serializers.Serializer):
    """Serializer for payment receipt"""

    receipt_number = serializers.CharField()
    guest_name = serializers.CharField()
    room_number = serializers.CharField()
    service_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    reference_number = serializers.CharField(allow_blank=True)
    paid_at = serializers.DateTimeField()
    hotel_name = serializers.CharField(default="Bayawan Mini Hotel")