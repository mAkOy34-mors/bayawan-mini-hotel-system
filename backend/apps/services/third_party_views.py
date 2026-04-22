# apps/services/third_party_views.py
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import uuid
from decimal import Decimal

from .third_party_models import ThirdPartyPartner, PartnerService, GuestPartnerRequest, CommissionPayment, \
    CommissionPayout
from .third_party_serializers import (
    ThirdPartyPartnerSerializer,
    ThirdPartyPartnerWriteSerializer,
    PartnerServiceSerializer,
    GuestPartnerRequestSerializer,
    CreateGuestPartnerRequestSerializer,
    CommissionPaymentSerializer, CommissionPayoutSerializer,
)


# ──────────────────────────────────────────────
# GUEST VIEWS
# ──────────────────────────────────────────────

class PartnerListView(APIView):
    """GET /api/v1/partners/ — Public list of active partners for guests"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', '')
        partners = ThirdPartyPartner.objects.filter(status='ACTIVE').prefetch_related('services')

        if category:
            partners = partners.filter(category=category)

        # Categories summary for filter tabs
        categories = (
            ThirdPartyPartner.objects
            .filter(status='ACTIVE')
            .values('category')
            .annotate(count=Count('id'))
            .order_by('category')
        )
        cat_map = {c: l for c, l in ThirdPartyPartner.CATEGORY_CHOICES}
        cat_list = [
            {'value': c['category'], 'label': cat_map.get(c['category'], c['category']), 'count': c['count']}
            for c in categories
        ]

        return Response({
            'partners': ThirdPartyPartnerSerializer(partners, many=True).data,
            'categories': cat_list,
        })


class PartnerDetailView(APIView):
    """GET /api/v1/partners/<id>/ — Single partner detail"""
    permission_classes = [IsAuthenticated]

    def get(self, request, partner_id):
        try:
            partner = ThirdPartyPartner.objects.prefetch_related('services').get(id=partner_id, status='ACTIVE')
        except ThirdPartyPartner.DoesNotExist:
            return Response({'error': 'Partner not found'}, status=404)
        return Response(ThirdPartyPartnerSerializer(partner).data)


# In your third_party_views.py - GuestPartnerRequestView

class GuestPartnerRequestView(APIView):
    """POST/GET /api/v1/partners/requests/ — Guest creates / views requests"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = GuestPartnerRequest.objects.filter(guest=request.user).order_by('-created_at')
        return Response(GuestPartnerRequestSerializer(requests, many=True).data)

    def post(self, request):
        serializer = CreateGuestPartnerRequestSerializer(
            data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            req = serializer.save()
            # Return the created request with ID
            return Response({
                'id': req.id,
                'message': 'Request submitted successfully',
                'total_amount': float(req.total_amount),
                'status': req.status,
                'payment_status': req.payment_status
            }, status=201)
        return Response(serializer.errors, status=400)


# ──────────────────────────────────────────────
# RECEPTION / ADMIN MANAGEMENT VIEWS
# ──────────────────────────────────────────────

class AdminPartnerListView(APIView):
    """GET/POST /api/v1/partners/admin/ — Admin CRUD on partners"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        partners = ThirdPartyPartner.objects.prefetch_related('services').all()
        return Response(ThirdPartyPartnerSerializer(partners, many=True).data)

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        serializer = ThirdPartyPartnerWriteSerializer(data=request.data)
        if serializer.is_valid():
            partner = serializer.save(created_by=request.user)
            return Response(ThirdPartyPartnerSerializer(partner).data, status=201)
        return Response(serializer.errors, status=400)


class AdminPartnerDetailView(APIView):
    """PUT/DELETE /api/v1/partners/admin/<id>/"""
    permission_classes = [IsAuthenticated]

    def _get_partner(self, partner_id):
        try:
            return ThirdPartyPartner.objects.get(id=partner_id)
        except ThirdPartyPartner.DoesNotExist:
            return None

    def put(self, request, partner_id):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        partner = self._get_partner(partner_id)
        if not partner:
            return Response({'error': 'Partner not found'}, status=404)
        serializer = ThirdPartyPartnerWriteSerializer(partner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ThirdPartyPartnerSerializer(partner).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, partner_id):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        partner = self._get_partner(partner_id)
        if not partner:
            return Response({'error': 'Partner not found'}, status=404)
        partner.status = 'INACTIVE'
        partner.save()
        return Response({'message': 'Partner deactivated'})


class AdminPartnerServiceView(APIView):
    """POST /api/v1/partners/admin/<id>/services/ — Add services to a partner"""
    permission_classes = [IsAuthenticated]

    def post(self, request, partner_id):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        try:
            partner = ThirdPartyPartner.objects.get(id=partner_id)
        except ThirdPartyPartner.DoesNotExist:
            return Response({'error': 'Partner not found'}, status=404)

        data = {**request.data, 'partner': partner.id}
        serializer = PartnerServiceSerializer(data=data)
        if serializer.is_valid():
            service = PartnerService.objects.create(partner=partner, **serializer.validated_data)
            return Response(PartnerServiceSerializer(service).data, status=201)
        return Response(serializer.errors, status=400)


class ReceptionPartnerRequestsView(APIView):
    """GET /api/v1/partners/reception/requests/ — Reception views all partner requests"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        status_filter = request.query_params.get('status', '')
        requests_qs = GuestPartnerRequest.objects.select_related('partner', 'partner_service', 'guest')

        if status_filter:
            requests_qs = requests_qs.filter(status=status_filter)

        stats = {
            'pending': GuestPartnerRequest.objects.filter(status='PENDING').count(),
            'confirmed': GuestPartnerRequest.objects.filter(status='CONFIRMED').count(),
            'completed': GuestPartnerRequest.objects.filter(status='COMPLETED').count(),
            'total': GuestPartnerRequest.objects.count(),
            'total_commission': float(
                GuestPartnerRequest.objects.filter(status='COMPLETED').aggregate(
                    t=Sum('commission_amount')
                )['t'] or 0
            ),
        }

        return Response({
            'requests': GuestPartnerRequestSerializer(requests_qs, many=True).data,
            'stats': stats,
        })


class UpdatePartnerRequestStatusView(APIView):
    """PATCH /api/v1/partners/requests/<id>/status/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, request_id):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)
        try:
            req = GuestPartnerRequest.objects.get(id=request_id)
        except GuestPartnerRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        new_status = request.data.get('status')
        total_amount = request.data.get('total_amount')

        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        req.status = new_status
        req.handled_by = request.user

        if total_amount:
            req.total_amount = Decimal(str(total_amount))

        if new_status == 'CONFIRMED':
            req.confirmed_at = timezone.now()
        elif new_status == 'COMPLETED':
            req.completed_at = timezone.now()
            req.payment_status = 'PAID'

        req.save()
        return Response(GuestPartnerRequestSerializer(req).data)


# ──────────────────────────────────────────────
# ADMIN ANALYTICS
# ──────────────────────────────────────────────

# apps/services/third_party_views.py

class AdminCommissionDashboardView(APIView):
    """GET /api/v1/partners/admin/commission-dashboard/ — Commission analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)

        from datetime import date, timedelta
        today = date.today()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)

        completed_requests = GuestPartnerRequest.objects.filter(status='COMPLETED')

        # Total commission earned (all time)
        total_commission = completed_requests.aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')

        # This month's commission
        this_month_commission = completed_requests.filter(
            completed_at__date__gte=this_month_start
        ).aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')

        # Last month's commission
        last_month_commission = completed_requests.filter(
            completed_at__date__gte=last_month_start,
            completed_at__date__lte=last_month_end
        ).aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')

        # Requests summary - ADD MORE DETAILS
        total_requests = GuestPartnerRequest.objects.count()
        pending_requests = GuestPartnerRequest.objects.filter(status='PENDING').count()
        confirmed_requests = GuestPartnerRequest.objects.filter(status='CONFIRMED').count()
        in_progress_requests = GuestPartnerRequest.objects.filter(status='IN_PROGRESS').count()
        completed_count = GuestPartnerRequest.objects.filter(status='COMPLETED').count()
        cancelled_requests = GuestPartnerRequest.objects.filter(status='CANCELLED').count()

        this_month_requests = GuestPartnerRequest.objects.filter(
            created_at__date__gte=this_month_start
        ).count()

        # Commission by partner (top earners)
        by_partner = (
            completed_requests
            .values('partner__id', 'partner__name', 'partner__category')
            .annotate(
                total_commission=Sum('commission_amount'),
                total_gross=Sum('total_amount'),
                request_count=Count('id'),
            )
            .order_by('-total_commission')[:10]
        )

        # Commission by category
        by_category = (
            completed_requests
            .values('partner__category')
            .annotate(
                total_commission=Sum('commission_amount'),
                request_count=Count('id'),
            )
            .order_by('-total_commission')
        )
        cat_map = {c: l for c, l in ThirdPartyPartner.CATEGORY_CHOICES}

        # Monthly trend (last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            if i > 0:
                next_month = (month_start + timedelta(days=32)).replace(day=1)
            else:
                next_month = today + timedelta(days=1)
            m_commission = completed_requests.filter(
                completed_at__date__gte=month_start,
                completed_at__date__lt=next_month,
            ).aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')
            m_requests = GuestPartnerRequest.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lt=next_month,
            ).count()
            monthly_trend.append({
                'month': month_start.strftime('%b %Y'),
                'commission': float(m_commission),
                'requests': m_requests,
            })

        # ✅ FIX: Show ALL recent requests (not just completed)
        # This allows admin to see pending, confirmed, in_progress requests too
        recent_requests = GuestPartnerRequest.objects.select_related(
            'partner', 'partner_service', 'guest', 'handled_by'
        ).order_by('-created_at')[:15]  # Last 15 requests of any status

        # MoM growth
        if last_month_commission > 0:
            mom_growth = float((this_month_commission - last_month_commission) / last_month_commission * 100)
        else:
            mom_growth = 0.0

        return Response({
            'summary': {
                'total_commission': float(total_commission),
                'this_month_commission': float(this_month_commission),
                'last_month_commission': float(last_month_commission),
                'mom_growth': round(mom_growth, 1),
                'total_requests': total_requests,
                'pending_requests': pending_requests,
                'confirmed_requests': confirmed_requests,
                'in_progress_requests': in_progress_requests,
                'completed_requests': completed_count,
                'cancelled_requests': cancelled_requests,
                'this_month_requests': this_month_requests,
                'active_partners': ThirdPartyPartner.objects.filter(status='ACTIVE').count(),
            },
            'by_partner': [
                {
                    'id': r['partner__id'],
                    'name': r['partner__name'],
                    'category': cat_map.get(r['partner__category'], r['partner__category']),
                    'total_commission': float(r['total_commission']),
                    'total_gross': float(r['total_gross']),
                    'request_count': r['request_count'],
                }
                for r in by_partner
            ],
            'by_category': [
                {
                    'category': cat_map.get(r['partner__category'], r['partner__category']),
                    'total_commission': float(r['total_commission']),
                    'request_count': r['request_count'],
                }
                for r in by_category
            ],
            'monthly_trend': monthly_trend,
            'recent_requests': GuestPartnerRequestSerializer(recent_requests, many=True).data,
            # Changed from recent_completed
        })

class AdminCommissionPaymentView(APIView):
    """POST/GET /api/v1/partners/admin/commission-payments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        payments = CommissionPayment.objects.select_related('partner').order_by('-received_at')
        return Response(CommissionPaymentSerializer(payments, many=True).data)

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)
        data = {**request.data, 'reference_number': f"COM-{uuid.uuid4().hex[:8].upper()}"}
        serializer = CommissionPaymentSerializer(data=data)
        if serializer.is_valid():
            payment = serializer.save(received_by=request.user)
            return Response(CommissionPaymentSerializer(payment).data, status=201)
        return Response(serializer.errors, status=400)


# Add these new endpoints to third_party_views.py

# apps/services/third_party_views.py

class CollectPartnerPaymentView(APIView):
    """POST /api/v1/partners/requests/<id>/collect-payment/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        try:
            req = GuestPartnerRequest.objects.select_related('partner', 'partner_service').get(id=request_id)
        except GuestPartnerRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'CASH')
        reference_number = request.data.get('reference_number', '')
        notes = request.data.get('notes', '')

        if not amount:
            return Response({'error': 'Amount required'}, status=400)

        # Update payment status
        req.payment_status = 'PAID'
        req.payment_method_detail = payment_method
        req.paid_at = timezone.now()
        req.receipt_number = f"RCP-{uuid.uuid4().hex[:8].upper()}"

        # Append notes
        if notes:
            req.notes = (req.notes or '') + f"\n{notes}"
        if reference_number:
            req.notes = (req.notes or '') + f"\nReference: {reference_number}"

        req.save()

        # Update request status to CONFIRMED if still pending
        if req.status == 'PENDING':
            req.status = 'CONFIRMED'
            req.confirmed_at = timezone.now()
            req.save()

        # Get service name safely
        service_name = None
        if req.partner_service:
            service_name = req.partner_service.name
        elif req.partner:
            service_name = req.partner.name

        return Response({
            'success': True,
            'message': 'Payment collected successfully',
            'receipt': {
                'receipt_number': req.receipt_number,
                'guest_name': req.guest_name,
                'room_number': req.room_number,
                'service_name': service_name,
                'amount': float(req.total_amount),
                'payment_method': payment_method,
                'reference_number': reference_number,
                'paid_at': req.paid_at.isoformat(),
            }
        })
class PartnerPayoutsView(APIView):
    """GET/POST /api/v1/partners/admin/payouts/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)

        partners = ThirdPartyPartner.objects.filter(status='ACTIVE')
        payouts = CommissionPayout.objects.all().order_by('-created_at')

        partner_data = []
        for partner in partners:
            completed_requests = GuestPartnerRequest.objects.filter(
                partner=partner, status='COMPLETED', payment_status='PAID'
            )
            total_commission = completed_requests.aggregate(t=Sum('commission_amount'))['t'] or Decimal('0')
            paid_commission = CommissionPayout.objects.filter(
                partner=partner, status='COMPLETED'
            ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

            partner_data.append({
                'id': partner.id,
                'name': partner.name,
                'category': partner.get_category_display(),
                'payout_email': partner.payout_email,
                'bank_account_name': partner.bank_account_name,
                'bank_name': partner.bank_name,
                'bank_account_number': partner.bank_account_number,
                'gcash_number': partner.gcash_number,
                'total_commission': float(total_commission),
                'paid_commission': float(paid_commission),
                'pending_commission': float(total_commission - paid_commission),
                'completed_requests_count': completed_requests.count(),
            })

        return Response({
            'partners': partner_data,
            'payouts': CommissionPayoutSerializer(payouts, many=True).data,
        })

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)

        serializer = CommissionPayoutSerializer(data=request.data)
        if serializer.is_valid():
            payout = serializer.save(created_by=request.user)

            # If paying via PayMongo, generate payout link
            if request.data.get('payment_method') == 'PAYMONGO':
                # Here you would integrate with PayMongo payout API
                # For now, just mark as completed
                payout.status = 'COMPLETED'
                payout.paid_at = timezone.now()
                payout.save()

            return Response(CommissionPayoutSerializer(payout).data, status=201)
        return Response(serializer.errors, status=400)


class UpdatePartnerPayoutStatusView(APIView):
    """PATCH /api/v1/partners/admin/payouts/<id>/status/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, payout_id):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)

        try:
            payout = CommissionPayout.objects.get(id=payout_id)
        except CommissionPayout.DoesNotExist:
            return Response({'error': 'Payout not found'}, status=404)

        new_status = request.data.get('status')
        if new_status:
            payout.status = new_status
            if new_status == 'COMPLETED':
                payout.paid_at = timezone.now()
            payout.save()

        return Response(CommissionPayoutSerializer(payout).data)


# apps/services/third_party_views.py

class CreatePartnerServicePaymentView(APIView):
    """POST /api/v1/partners/requests/<id>/create-payment/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            partner_request = GuestPartnerRequest.objects.select_related('partner', 'partner_service', 'guest').get(
                id=request_id,
                guest=request.user
            )
        except GuestPartnerRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        # Check if already paid
        if partner_request.payment_status == 'PAID':
            return Response({'error': 'This request has already been paid'}, status=400)

        # Get service name safely
        service_name = partner_request.partner_service.name if partner_request.partner_service else partner_request.partner.name

        # Create PayMongo payment link
        from apps.payments.paymongo import create_payment_link

        try:
            result = create_payment_link(
                amount=float(partner_request.total_amount),
                description=f"Partner Service: {partner_request.partner.name} - {service_name}",
                remarks=f"Guest: {partner_request.guest_name}, Room: {partner_request.room_number}",
                booking_id=None,
                booking_reference=partner_request.receipt_number or f"PS-{partner_request.id}"
            )
        except Exception as e:
            return Response({'error': str(e)}, status=502)

        # Store payment intent ID
        partner_request.payment_intent_id = result['paymongo_link_id']
        partner_request.save()

        return Response({
            'checkout_url': result['checkout_url'],
            'payment_id': result['paymongo_link_id'],
            'amount': float(partner_request.total_amount)
        })

class VerifyPartnerServicePaymentView(APIView):
    """GET /api/v1/partners/requests/<id>/verify-payment/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        try:
            partner_request = GuestPartnerRequest.objects.get(id=request_id, guest=request.user)
        except GuestPartnerRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        return Response({
            'id': partner_request.id,
            'payment_status': partner_request.payment_status,
            'paid_at': partner_request.paid_at.isoformat() if partner_request.paid_at else None,
            'receipt_number': partner_request.receipt_number,
            'total_amount': float(partner_request.total_amount)
        })