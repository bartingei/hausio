import uuid
from django.db import models
from accounts.models import User


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