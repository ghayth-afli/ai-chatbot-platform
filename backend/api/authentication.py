"""
Custom JWT authentication that reads tokens from HTTP-only cookies.

This allows the frontend to use secure HTTP-only cookies for storing JWT tokens
while still allowing Bearer token authentication for API clients.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
	"""
	JWT authentication that reads tokens from HTTP-only cookies.
	
	Supports:
	1. Authorization: Bearer <token> header (for API clients)
	2. access_token cookie (for web frontend)
	"""
	
	def authenticate(self, request):
		"""
		Attempt to authenticate using JWT from either:
		1. Authorization header (Bearer scheme)
		2. access_token cookie
		"""
		# Try to get token from Authorization header first
		header = self.get_header(request)
		if header is not None:
			try:
				return super().authenticate(request)
			except AuthenticationFailed:
				# Authorization header failed, try cookies below
				pass
		
		# Try to get token from access_token cookie
		token = request.COOKIES.get('access_token')
		if token is not None:
			try:
				validated_token = self.get_validated_token(token)
				return self.get_user(validated_token), validated_token
			except InvalidToken as e:
				raise AuthenticationFailed(f'Invalid token in cookie: {str(e)}') from e
		
		# No token found in either location
		return None
