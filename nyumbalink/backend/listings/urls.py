from django.urls import path
from .views import (
    ListingListCreateView,
    ListingDetailView,
    LandlordListingsView,
    AdminListingApprovalView,
    ScamReportView,
)

urlpatterns = [
    path('',                        ListingListCreateView.as_view(),  name='listing-list'),
    path('<uuid:pk>/',              ListingDetailView.as_view(),      name='listing-detail'),
    path('mine/',                   LandlordListingsView.as_view(),   name='my-listings'),
    path('<uuid:pk>/approve/',      AdminListingApprovalView.as_view(), name='listing-approve'),
    path('report/',                 ScamReportView.as_view(),         name='scam-report'),
]