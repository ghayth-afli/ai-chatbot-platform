#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(email='test@example.com')
    user.extension.is_verified = True
    user.extension.save()
    print(f"✓ User {user.email} verified successfully!")
except User.DoesNotExist:
    print("✗ User not found")
