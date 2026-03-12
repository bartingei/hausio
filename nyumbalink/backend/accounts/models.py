import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        TENANT   = 'tenant',   'Tenant'
        LANDLORD = 'landlord', 'Landlord'
        ADMIN    = 'admin',    'Admin'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email       = models.EmailField(unique=True)
    phone       = models.CharField(max_length=20, blank=True)
    role        = models.CharField(max_length=10, choices=Role.choices, default=Role.TENANT)
    is_verified = models.BooleanField(default=False)  # Admin sets after ID check
    created_at  = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"