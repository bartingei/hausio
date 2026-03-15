from rest_framework import serializers
from .models import Listing, ListingPhoto, ScamReport, Review, Bookmark, NeighbourhoodSafety


class ListingPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ListingPhoto
        fields = ['id', 'image', 'is_primary', 'uploaded_at']


class ListingSerializer(serializers.ModelSerializer):
    photos            = ListingPhotoSerializer(many=True, read_only=True)
    landlord_email    = serializers.EmailField(source='landlord.email', read_only=True)
    landlord_verified = serializers.BooleanField(source='landlord.is_verified', read_only=True)
    uploaded_images   = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    avg_rating        = serializers.SerializerMethodField()
    review_count      = serializers.SerializerMethodField()
    bookmark_count    = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_bookmark_count(self, obj):
        return obj.bookmarks.count()
    
    def validate_uploaded_images(self, value):
        if len(value) > 4:
            raise serializers.ValidationError('Maximum 4 photos allowed.')
        return value

    class Meta:
        model  = Listing
        fields = [
            'id', 'landlord', 'landlord_email', 'landlord_verified',
            'title', 'description', 'rent_kes', 'bedrooms',
            'is_furnished', 'area_name', 'location_lat', 'location_lng',
            'status', 'photos', 'uploaded_images', 'created_at', 'updated_at',
            'avg_rating', 'review_count', 'bookmark_count',
        ]
        read_only_fields = ['id', 'landlord', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        images = validated_data.pop('uploaded_images', [])
        if isinstance(validated_data.get('is_furnished'), str):
            validated_data['is_furnished'] = validated_data['is_furnished'].lower() == 'true'
        listing = Listing.objects.create(**validated_data)
        for i, image in enumerate(images[:4]):
            ListingPhoto.objects.create(
                listing=listing, image=image, is_primary=(i == 0)
            )
        return listing

    def update(self, instance, validated_data):
        images = validated_data.pop('uploaded_images', [])
        if isinstance(validated_data.get('is_furnished'), str):
            validated_data['is_furnished'] = validated_data['is_furnished'].lower() == 'true'
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if images:
            existing = instance.photos.count()
            slots = max(0, 4 - existing)
            for i, image in enumerate(images[:slots]):
                ListingPhoto.objects.create(
                    listing=instance, image=image, is_primary=(i == 0 and existing == 0)
                )
        return instance

class ScamReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScamReport
        fields = ['id', 'listing', 'reason', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    tenant_email = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = ['id', 'listing', 'tenant', 'tenant_email', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'tenant', 'listing', 'created_at']

    def get_tenant_email(self, obj):
        return obj.tenant.email

    def validate(self, data):
        request = self.context['request']
        if request.user.role != 'tenant':
            raise serializers.ValidationError('Only tenants can leave reviews.')
        return data

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user
        return super().create(validated_data)


class BookmarkSerializer(serializers.ModelSerializer):
    listing_data = serializers.SerializerMethodField()

    class Meta:
        model  = Bookmark
        fields = ['id', 'listing', 'listing_data', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_listing_data(self, obj):
        return ListingSerializer(obj.listing, context=self.context).data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NeighbourhoodSafetySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NeighbourhoodSafety
        fields = ['id', 'area_name', 'safety_score', 'lighting', 'transport', 'noise_level', 'notes', 'updated_at']