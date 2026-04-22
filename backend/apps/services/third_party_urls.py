# apps/services/third_party_urls.py
# Append third_party_urlpatterns into apps/services/urls.py like so:
#
#   from .third_party_urls import third_party_urlpatterns
#   urlpatterns += third_party_urlpatterns
#
# Final base URL will be: /api/v1/services/partners/...

from django.urls import path
from . import third_party_views as tp

# ⚠️  ORDER MATTERS: static segments must come before dynamic <int:...> segments
# so Django doesn't try to cast "requests", "admin", etc. as integers.

third_party_urlpatterns = [

    # ── Static paths first ────────────────────────────────────────────────────

    # Guest — view own requests & submit new ones
    path('partners/requests/',
         tp.GuestPartnerRequestView.as_view(),
         name='guest-partner-requests'),

    # Reception — view all requests
    path('partners/reception/requests/',
         tp.ReceptionPartnerRequestsView.as_view(),
         name='reception-partner-requests'),

    # Admin — list / create partners
    path('partners/admin/',
         tp.AdminPartnerListView.as_view(),
         name='admin-partner-list'),

    # Admin — commission analytics
    path('partners/admin/commission-dashboard/',
         tp.AdminCommissionDashboardView.as_view(),
         name='commission-dashboard'),

    # Admin — commission payments
    path('partners/admin/commission-payments/',
         tp.AdminCommissionPaymentView.as_view(),
         name='commission-payments'),

    # ── Dynamic paths after ───────────────────────────────────────────────────

    # Guest — browse active partners
    path('partners/',
         tp.PartnerListView.as_view(),
         name='partner-list'),

    # Guest — single partner detail
    path('partners/<int:partner_id>/',
         tp.PartnerDetailView.as_view(),
         name='partner-detail'),

    # Reception / Admin — update a request's status
    path('partners/requests/<int:request_id>/status/',
         tp.UpdatePartnerRequestStatusView.as_view(),
         name='update-partner-request-status'),

    # Admin — edit / deactivate a specific partner
    path('partners/admin/<int:partner_id>/',
         tp.AdminPartnerDetailView.as_view(),
         name='admin-partner-detail'),

    # Admin — add services to a specific partner
    path('partners/admin/<int:partner_id>/services/',
         tp.AdminPartnerServiceView.as_view(),
         name='admin-partner-services'),

# Add these to third_party_urlpatterns

# Reception - collect payment
path('partners/requests/<int:request_id>/collect-payment/',
     tp.CollectPartnerPaymentView.as_view(),
     name='collect-partner-payment'),

# Admin - partner payouts
path('partners/admin/payouts/',
     tp.PartnerPayoutsView.as_view(),
     name='partner-payouts'),

path('partners/admin/payouts/<int:payout_id>/status/',
     tp.UpdatePartnerPayoutStatusView.as_view(),
     name='update-payout-status'),

# Add these to third_party_urlpatterns

# Guest - create payment for partner request
path('partners/requests/<int:request_id>/create-payment/',
     tp.CreatePartnerServicePaymentView.as_view(),
     name='create-partner-payment'),

# Guest - verify payment status
path('partners/requests/<int:request_id>/verify-payment/',
     tp.VerifyPartnerServicePaymentView.as_view(),
     name='verify-partner-payment'),
]