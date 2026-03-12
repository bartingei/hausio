from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ScamReport
from .serializers import ListingSerializer, ScamReportSerializer


class IsLandlordOrReadOnly(permissions.BasePermission):
    """Only landlords can create listings. Anyone can read."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'landlord'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.landlord == request.user


class ListingListCreateView(generics.ListCreateAPIView):
    serializer_class   = ListingSerializer
    permission_classes = [IsLandlordOrReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['area_name', 'bedrooms', 'is_furnished', 'status']
    search_fields      = ['title', 'description', 'area_name']
    ordering_fields    = ['rent_kes', 'created_at']

    def get_queryset(self):
        queryset = Listing.objects.filter(status='verified')
        min_rent = self.request.query_params.get('min_rent')
        max_rent = self.request.query_params.get('max_rent')
        if min_rent:
            queryset = queryset.filter(rent_kes__gte=min_rent)
        if max_rent:
            queryset = queryset.filter(rent_kes__lte=max_rent)
        return queryset

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Listing.objects.all()
    serializer_class   = ListingSerializer
    permission_classes = [IsLandlordOrReadOnly]


class LandlordListingsView(generics.ListAPIView):
    """Landlord sees all their own listings including pending/rejected."""
    serializer_class   = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Listing.objects.filter(landlord=self.request.user)


class AdminListingApprovalView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found'}, status=404)

        new_status = request.data.get('status')
        if new_status not in ['verified', 'rejected', 'pending']:
            return Response({'error': 'Invalid status'}, status=400)

        listing.status = new_status
        listing.save()
        return Response(ListingSerializer(listing).data)

class ScamReportView(generics.CreateAPIView):
    serializer_class   = ScamReportSerializer
    permission_classes = [permissions.IsAuthenticated]

class AdminAllListingsView(generics.ListAPIView):
    """Admin sees every listing regardless of status."""
    serializer_class   = ListingSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        status = self.request.query_params.get('status')
        qs = Listing.objects.all()
        if status:
            qs = qs.filter(status=status)
        return qs

class AdminDeleteListingView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
            listing.delete()
            return Response({'message': 'Listing deleted'}, status=204)
        except Listing.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)