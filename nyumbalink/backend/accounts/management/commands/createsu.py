from django.core.management.base import BaseCommand
from accounts.models import User
import os

class Command(BaseCommand):
    def handle(self, *args, **options):
        if os.environ.get('CREATE_SUPERUSER'):
            if not User.objects.filter(email='admin@hausio.com').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@hausio.com',
                    password='Hausio@Admin2024',
                    role='admin',
                )
                self.stdout.write('Superuser created')
```

Then update your `Procfile`:
```
web: python manage.py collectstatic --noinput && python manage.py migrate && python manage.py createsu && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT