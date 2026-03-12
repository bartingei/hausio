from rest_framework import serializers
from .models import Listing, ListingPhoto, ScamReport


class ListingPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ListingPhoto
        fields = ['id', 'image', 'is_primary', 'uploaded_at']


class ListingSerializer(serializers.ModelSerializer):
    photos           = ListingPhotoSerializer(many=True, read_only=True)
    landlord_email   = serializers.EmailField(source='landlord.email', read_only=True)
    landlord_verified = serializers.BooleanField(source='landlord.is_verified', read_only=True)
    uploaded_images  = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model  = Listing
        fields = [
            'id', 'title', 'description', 'rent_kes', 'bedrooms',
            'is_furnished', 'area_name', 'location_lat', 'location_lng',
            'status', 'landlord_email', 'landlord_verified',
            'photos', 'uploaded_images', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        images = validated_data.pop('uploaded_images', [])
        listing = Listing.objects.create(**validated_data)

        for i, image in enumerate(images):
            ListingPhoto.objects.create(
                listing    = listing,
                image      = image,
                is_primary = (i == 0),  # First image is primary
            )
        return listing


class ScamReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScamReport
        fields = ['id', 'listing', 'reason', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user
        return super().create(validated_data)