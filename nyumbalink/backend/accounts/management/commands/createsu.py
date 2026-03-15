from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    def handle(self, *args, **options):
        if not User.objects.filter(email='bartingeijohnpaul@gmail.com').exists():
            User.objects.create_superuser(
                username='admin',
                email='bartingeijohnpaul@gmail.com',
                password='B@rtingei4',
                role='admin',
            )
            self.stdout.write('Superuser created')
        else:
            self.stdout.write('Superuser already exists')