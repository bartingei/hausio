from django.urls import path
from .views import (
    ListingListCreateView,
    ListingDetailView,
    LandlordListingsView,
    AdminListingApprovalView,
    AdminAllListingsView,
    AdminDeleteListingView,
    ScamReportView,
)

urlpatterns = [
    path('',                        ListingListCreateView.as_view(),    name='listing-list'),
    path('mine/',                   LandlordListingsView.as_view(),     name='my-listings'),
    path('all/',                    AdminAllListingsView.as_view(),     name='all-listings'),
    path('report/',                 ScamReportView.as_view(),           name='scam-report'),
    path('<uuid:pk>/approve/',      AdminListingApprovalView.as_view(), name='listing-approve'),
    path('<uuid:pk>/admin-delete/', AdminDeleteListingView.as_view(),   name='admin-delete'),
    path('<uuid:pk>/',              ListingDetailView.as_view(),        name='listing-detail'),
]