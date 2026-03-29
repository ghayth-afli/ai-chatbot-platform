import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.models import User
from users.models import UserExtension

users = User.objects.all()
print(f"Total users: {users.count()}")
for user in users:
    try:
        ext = user.extension
        print(f"  - {user.email}: verified={ext.is_verified}, auth_provider={ext.auth_provider}")
    except Exception as e:
        print(f"  - {user.email}: no extension ({e})")
