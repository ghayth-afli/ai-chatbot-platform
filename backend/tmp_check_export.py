import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django

django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User

client = APIClient()
user = User.objects.get(id=7)
client.force_authenticate(user=user)
resp = client.get(
	'/api/chat/141/export/?format=pdf&language=en',
	HTTP_HOST='localhost'
)
resp = client.get(
	'/api/chat/141/export/?format=pdf&language=en',
	HTTP_HOST='localhost'
)
print('status', resp.status_code)
print('headers', {k: resp[k] for k in ['Content-Type', 'Content-Disposition'] if k in resp})
print('body-bytes', len(resp.content))
print('body', resp.content[:200])
