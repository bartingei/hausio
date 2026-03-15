from rest_framework import generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingPhoto, ScamReport, Review, Bookmark, NeighbourhoodSafety
from .serializers import (
    ListingSerializer, ScamReportSerializer,
    ReviewSerializer, BookmarkSerializer, NeighbourhoodSafetySerializer
)


class IsLandlordOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'landlord'


class ListingListCreateView(generics.ListCreateAPIView):
    serializer_class   = ListingSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['area_name', 'bedrooms', 'is_furnished', 'status']
    search_fields      = ['title', 'description', 'area_name']
    ordering_fields    = ['rent_kes', 'created_at']
    permission_classes = [IsLandlordOrReadOnly]

    def get_queryset(self):
        qs = Listing.objects.filter(status='verified')
        min_rent = self.request.query_params.get('min_rent')
        max_rent = self.request.query_params.get('max_rent')
        if min_rent:
            qs = qs.filter(rent_kes__gte=min_rent)
        if max_rent:
            qs = qs.filter(rent_kes__lte=max_rent)
        return qs

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Listing.objects.all()
    serializer_class   = ListingSerializer
    permission_classes = [IsLandlordOrReadOnly]


class LandlordListingsView(generics.ListAPIView):
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


class AdminAllListingsView(generics.ListAPIView):
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


class ScamReportView(generics.CreateAPIView):
    serializer_class   = ScamReportSerializer
    permission_classes = [permissions.IsAuthenticated]


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class   = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Review.objects.filter(listing_id=self.kwargs['pk']).order_by('-created_at')

    def perform_create(self, serializer):
        listing = Listing.objects.get(pk=self.kwargs['pk'])
        serializer.save(tenant=self.request.user, listing=listing)


class BookmarkToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing  = Listing.objects.get(pk=pk)
        bookmark = Bookmark.objects.filter(user=request.user, listing=listing).first()
        if bookmark:
            bookmark.delete()
            return Response({'bookmarked': False})
        Bookmark.objects.create(user=request.user, listing=listing)
        return Response({'bookmarked': True})


class BookmarkListView(generics.ListAPIView):
    serializer_class   = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')


class BookmarkStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        bookmarked = Bookmark.objects.filter(user=request.user, listing_id=pk).exists()
        return Response({'bookmarked': bookmarked})


class NeighbourhoodSafetyView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        area = request.query_params.get('area', '')
        try:
            safety = NeighbourhoodSafety.objects.get(area_name__iexact=area)
            return Response(NeighbourhoodSafetySerializer(safety).data)
        except NeighbourhoodSafety.DoesNotExist:
            return Response({'error': 'No safety data for this area'}, status=404)

    def post(self, request):
        area = request.data.get('area_name', '')
        instance = NeighbourhoodSafety.objects.filter(area_name__iexact=area).first()
        if instance:
            serializer = NeighbourhoodSafetySerializer(instance, data=request.data, partial=True)
        else:
            serializer = NeighbourhoodSafetySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        area = request.query_params.get('area', '')
        try:
            safety = NeighbourhoodSafety.objects.get(area_name__iexact=area)
            return Response(NeighbourhoodSafetySerializer(safety).data)
        except NeighbourhoodSafety.DoesNotExist:
            return Response({'error': 'No safety data for this area'}, status=404)