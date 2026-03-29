"""
Test full chat flow through backend
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 70)
print("TESTING FULL CHAT API FLOW")
print("=" * 70)

# Step 1: Login
print("\n1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": "debugtest@example.com", "password": "TestPassword123!"}
)
token = login_response.json().get("access_token")
print(f"✓ Token: {token[:30]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Create a chat session
print("\n2. Creating chat session...")
create_response = requests.post(
    f"{BASE_URL}/chat/",
    headers=headers,
    json={"title": "OpenRouter Test", "model": "nemotron"}
)
session_data = create_response.json()
session_id = session_data['id']
print(f"✓ Session created: ID={session_id}, Model={session_data['model']}")

# Step 3: Send a message
print("\n3. Sending message to AI...")
send_response = requests.post(
    f"{BASE_URL}/chat/{session_id}/send/",
    headers=headers,
    json={"message": "Hello, what is 2+2?", "model": "nemotron"}
)

if send_response.status_code == 200:
    msg_data = send_response.json()
    print(f"✓ Response received")
    print(f"  Status: {send_response.status_code}")
    print(f"  AI Message: {msg_data.get('ai_message', {}).get('content', 'NONE')[:100]}")
else:
    print(f"✗ Error: {send_response.status_code}")
    print(f"  Response: {send_response.text[:200]}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
