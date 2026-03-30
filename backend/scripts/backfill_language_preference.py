#!/usr/bin/env python
"""
Backfill script: Set all existing users' language_preference to 'en'
This ensures backward compatibility for all existing users.

Usage:
    python backend/scripts/backfill_language_preference.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import Profile
from django.contrib.auth.models import User

def backfill_language_preferences():
    """Set language_preference='en' for all users without a language preference."""
    
    print("Backfilling language preferences...")
    
    # Get all users
    users = User.objects.all()
    updated_count = 0
    
    for user in users:
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = Profile.objects.create(user=user, language_preference='en')
            updated_count += 1
            print(f"✓ Created profile for {user.username} with language_preference='en'")
            continue
        
        # Ensure language_preference is set (should be default='en', but double-check)
        if not profile.language_preference or profile.language_preference == '':
            profile.language_preference = 'en'
            profile.save()
            updated_count += 1
            print(f"✓ Updated {user.username} language preference to 'en'")
    
    # Verify backfill
    all_profiles_en = Profile.objects.filter(language_preference='en').count()
    all_profiles_ar = Profile.objects.filter(language_preference='ar').count()
    
    print(f"\nBackfill complete!")
    print(f"  - Updated/Created: {updated_count}")
    print(f"  - Total profiles with 'en': {all_profiles_en}")
    print(f"  - Total profiles with 'ar': {all_profiles_ar}")
    print(f"  - Total users: {users.count()}")

if __name__ == '__main__':
    backfill_language_preferences()
