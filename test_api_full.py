import requests
import json

BASE_URL = "http://localhost:8000/api"

# Step 1: Login
print("=" * 60)
print("STEP 1: Login")
print("=" * 60)
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": "debugtest@example.com", "password": "TestPassword123!"}
)
print(f"Status: {login_response.status_code}")
login_data = login_response.json()
token = login_data.get("access_token")
print(f"✓ Token received: {token[:30]}...")

# Step 2: Test /api/chat/ with token
print("\n" + "=" * 60)
print("STEP 2: Test /api/chat/ (GET) - List sessions")
print("=" * 60)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
response = requests.get(f"{BASE_URL}/chat/", headers=headers)
print(f"Status: {response.status_code}")
data = response.json()
print(json.dumps(data, indent=2))

# Step 3: Create new session
print("\n" + "=" * 60)
print("STEP 3: Create new chat session")
print("=" * 60)
create_response = requests.post(
    f"{BASE_URL}/chat/",
    headers=headers,
    json={"title": "Test Session", "model": "nemotron"}
)
print(f"Status: {create_response.status_code}")
print(json.dumps(create_response.json(), indent=2))
