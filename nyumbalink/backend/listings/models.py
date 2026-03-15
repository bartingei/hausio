import uuid
from django.db import models
from accounts.models import User
from django.conf import settings


class Listing(models.Model):
    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending Verification'
        VERIFIED = 'verified', 'Verified'
        RESERVED = 'reserved', 'Reserved'
        TAKEN    = 'taken',    'Taken'
        REJECTED = 'rejected', 'Rejected'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    rent_kes     = models.PositiveIntegerField(help_text="Monthly rent in KES")
    bedrooms     = models.PositiveSmallIntegerField(help_text="0 = bedsitter")
    is_furnished = models.BooleanField(default=False)
    area_name    = models.CharField(max_length=100, help_text="e.g. Rongai, Kasarani")
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — KES {self.rent_kes:,}"


class ListingPhoto(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing       = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='photos')
    image         = models.ImageField(upload_to='listings/')
    is_primary    = models.BooleanField(default=False)
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.listing.title}"


class ScamReport(models.Model):
    class Reason(models.TextChoices):
        FAKE_PHOTOS  = 'fake_photos',  'Fake Photos'
        ALREADY_TAKEN = 'already_taken', 'Already Taken'
        WRONG_PRICE  = 'wrong_price',  'Wrong Price'
        FAKE_AGENT   = 'fake_agent',   'Fake Agent'
        OTHER        = 'other',        'Other'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing     = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reports_made')
    reason      = models.CharField(max_length=20, choices=Reason.choices)
    details     = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-flag listing after 3 reports
        if self.listing.reports.count() >= 3:
            self.listing.status = Listing.Status.REJECTED
            self.listing.save()

    def __str__(self):
        return f"Report on {self.listing.title} — {self.reason}"

class Review(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing     = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating      = models.IntegerField(choices=RATING_CHOICES)
    comment     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('listing', 'tenant')

    def __str__(self):
        return f'{self.tenant.email} → {self.listing.title} ({self.rating}★)'


class Bookmark(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'listing')

class NeighbourhoodSafety(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    area_name    = models.CharField(max_length=100, unique=True)
    safety_score = models.IntegerField(default=3)  # 1-5
    lighting     = models.IntegerField(default=3)  # 1-5
    transport    = models.IntegerField(default=3)  # 1-5
    noise_level  = models.IntegerField(default=3)  # 1-5 (1=quiet, 5=noisy)
    notes        = models.TextField(blank=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.area_name} ({self.safety_score}★)'