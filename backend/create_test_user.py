import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.models import User
from users.models import UserExtension

# Create or get test user
email = 'debugtest@example.com'
password = 'TestPassword123!'

try:
    user = User.objects.get(email=email)
    print(f"User {email} already exists")
    user.set_password(password)
    user.save()
    print(f"Updated password for {email}")
except User.DoesNotExist:
    user = User.objects.create_user(
        username=email.split('@')[0],
        email=email,
        password=password,
        first_name='Debug',
        last_name='Test'
    )
    print(f"Created new user: {email}")

# Verify the user
try:
    ext = user.extension
except:
    ext = UserExtension.objects.create(user=user)

ext.is_verified = True
ext.auth_provider = 'email'
ext.save()

print(f"✓ Test user ready: {email} / {password}")
print(f"  Verified: True")
print(f"  Auth Provider: email")
