"""
Centralized error handling for consistent API error responses.

Maps 15 error codes to HTTP status codes and user-friendly messages.
"""

from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework import status as http_status
import uuid


# Error code definitions
ERROR_CODES = {
    'NOT_AUTHENTICATED': {'status': 401, 'message': 'Authentication required'},
    'TOKEN_EXPIRED': {'status': 401, 'message': 'Token has expired'},
    'INVALID_CREDENTIALS': {'status': 401, 'message': 'Invalid email or password'},
    'USER_NOT_VERIFIED': {'status': 403, 'message': 'User account not verified'},
    'INVALID_CODE': {'status': 400, 'message': 'Invalid or expired code'},
    'EMAIL_EXISTS': {'status': 400, 'message': 'Email already registered'},
    'PASSWORD_INVALID': {'status': 400, 'message': 'Password does not meet requirements'},
    'VALIDATION_ERROR': {'status': 400, 'message': 'Validation failed'},
    'INVALID_TOKEN': {'status': 401, 'message': 'Invalid token'},
    'RATE_LIMIT_EXCEEDED': {'status': 429, 'message': 'Too many requests'},
    'USER_NOT_FOUND': {'status': 404, 'message': 'User not found'},
    'INTERNAL_ERROR': {'status': 500, 'message': 'Internal server error'},
    'EMAIL_SERVICE_ERROR': {'status': 500, 'message': 'Email service error'},
    'DATABASE_ERROR': {'status': 500, 'message': 'Database error'},
    'GOOGLE_AUTH_FAILED': {'status': 400, 'message': 'Google authentication failed'},
    'TOKEN_ALREADY_USED': {'status': 400, 'message': 'Code already used'},
}


def get_error_response(error_code, details=None, status_code=None):
	"""
	Create standardized error response.
	
	Args:
		error_code (str): Error code from ERROR_CODES
		details (dict): Additional error details
		status_code (int): Override status code
		
	Returns:
		dict: Standardized error response
	"""
	error_info = ERROR_CODES.get(error_code, ERROR_CODES['INTERNAL_ERROR'])
	
	return {
		'error': error_code,
		'code': error_code,
		'message': error_info['message'],
		'status': status_code or error_info['status'],
		'details': details or {},
		'timestamp': now().isoformat(),
		'request_id': str(uuid.uuid4()),
	}


def custom_exception_handler(exc, context):
	"""
	Custom exception handler that returns standardized error responses.
	
	Catches all exceptions and formats them consistently.
	
	Args:
		exc: Exception instance
		context (dict): Context dict (request, view, etc.)
		
	Returns:
		Response: DRF Response with standardized error format
	"""
	from rest_framework.exceptions import ValidationError, AuthenticationFailed
	from rest_framework.exceptions import NotAuthenticated, PermissionDenied
	from rest_framework.exceptions import MethodNotAllowed, NotFound, Throttled
	
	error_code = 'INTERNAL_ERROR'
	status_code = 500
	details = {}
	
	# Handle DRF exceptions
	if isinstance(exc, ValidationError):
		error_code = 'VALIDATION_ERROR'
		status_code = 400
		details = exc.detail if hasattr(exc, 'detail') else {'error': str(exc)}
	
	elif isinstance(exc, AuthenticationFailed):
		error_code = 'INVALID_TOKEN'
		status_code = 401
	
	elif isinstance(exc, NotAuthenticated):
		error_code = 'NOT_AUTHENTICATED'
		status_code = 401
	
	elif isinstance(exc, PermissionDenied):
		error_code = 'USER_NOT_VERIFIED'
		status_code = 403
	
	elif isinstance(exc, NotFound):
		error_code = 'USER_NOT_FOUND'
		status_code = 404
	
	elif isinstance(exc, Throttled):
		error_code = 'RATE_LIMIT_EXCEEDED'
		status_code = 429
	
	elif isinstance(exc, MethodNotAllowed):
		error_code = 'VALIDATION_ERROR'
		status_code = 405
	
	# Return standardized response
	response_data = get_error_response(error_code, details, status_code)
	
	return Response(response_data, status=response_data['status'])


class APIException(Exception):
	"""Base API exception class for custom error handling."""
	
	def __init__(self, error_code, details=None, status_code=None):
		self.error_code = error_code
		self.details = details
		self.status_code = status_code
		super().__init__(error_code)
