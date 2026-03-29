"""
Test full chat flow - with detailed response
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 70)
print("TESTING FULL CHAT FLOW - DETAILED RESPONSE")
print("=" * 70)

# Step 1: Login
print("\n1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": "debugtest@example.com", "password": "TestPassword123!"}
)
token = login_response.json().get("access_token")
print("OK: Token received")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Create a chat session
print("\n2. Creating chat session...")
create_response = requests.post(
    f"{BASE_URL}/chat/",
    headers=headers,
    json={"title": "Test Session", "model": "nemotron"}
)
session_data = create_response.json()
session_id = session_data['id']
print(f"OK: Session ID: {session_id}")

# Step 3: Send a message
print("\n3. Sending message...")
send_response = requests.post(
    f"{BASE_URL}/chat/{session_id}/send/",
    headers=headers,
    json={"message": "Say hello", "model": "nemotron"}
)

print(f"Status: {send_response.status_code}")
print(f"\nFull Response:")
response_data = send_response.json()
print(json.dumps(response_data, indent=2))

print("\n" + "=" * 70)
