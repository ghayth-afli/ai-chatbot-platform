"""
Email template rendering for verification and password reset with i18n support.

Supports both EN and AR templates with appropriate RTL formatting for Arabic.
"""

from django.template.loader import render_to_string
from django.conf import settings


def send_verification_email(email, code, language='en'):
	"""
	Send email verification message.
	
	Args:
		email (str): Recipient email
		code (str): Verification code
		language (str): 'en' or 'ar'
		
	Returns:
		dict: {subject, html_content text_content}
	"""
	context = {
		'code': code,
		'email': email,
		'expiry_minutes': 10,
		'language': language,
	}
	
	if language == 'ar':
		subject = 'تحقق من بريدك الإلكتروني'
		template = 'emails/verify_email.ar.html'
	else:
		subject = 'Verify your email'
		template = 'emails/verify_email.html'
	
	html_content = render_to_string(template, context)
	text_content = f"Your verification code is: {code}\n\nThis code expires in 10 minutes."
	
	return {
		'subject': subject,
		'html_content': html_content,
		'text_content': text_content,
	}


def send_password_reset_email(email, code, language='en'):
	"""
	Send password reset message.
	
	Args:
		email (str): Recipient email
		code (str): Reset code
		language (str): 'en' or 'ar'
		
	Returns:
		dict: {subject, html_content, text_content}
	"""
	context = {
		'code': code,
		'email': email,
		'expiry_minutes': 10,
		'language': language,
	}
	
	if language == 'ar':
		subject = 'إعادة تعيين كلمة المرور'
		template = 'emails/reset_password.ar.html'
	else:
		subject = 'Reset your password'
		template = 'emails/reset_password.html'
	
	html_content = render_to_string(template, context)
	text_content = f"Your password reset code is: {code}\n\nThis code expires in 10 minutes."
	
	return {
		'subject': subject,
		'html_content': html_content,
		'text_content': text_content,
	}
