"""apps/rewards/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    # Guest
    path("my-points/",   views.MyPointsView.as_view()),
    path("my-history/",  views.MyRewardHistoryView.as_view()),
    path("promotions/",  views.ActivePromotionsView.as_view()),
    # Admin
    path("",                              views.AllRewardsView.as_view()),
    path("<int:user_pk>/adjust/",         views.AdjustPointsView.as_view()),
    path("rules/",                        views.RewardRulesView.as_view()),
    path("promotions/create/",            views.PromotionCreateView.as_view()),
]
