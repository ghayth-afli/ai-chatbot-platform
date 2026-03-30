"""
Language Service

Provides utilities for:
- Language code validation (ISO 639-1)
- Localized error message retrieval
- MSA prompt instruction generation
"""


class LanguageService:
    """Helper class for language-related operations."""

    SUPPORTED_LANGUAGES = ['en', 'ar']

    LANGUAGE_DISPLAY_NAMES = {
        'en': 'English',
        'ar': 'العربية'
    }

    # Error messages in English and Arabic (Formal MSA)
    ERROR_MESSAGES = {
        'invalid_language': {
            'en': 'Language not supported. Supported languages: English (en), Arabic (ar).',
            'ar': 'اللغة غير مدعومة. اللغات المدعومة: الإنجليزية (en)، العربية (ar).'
        },
        'chat_error': {
            'en': 'Failed to process your message. Please try again.',
            'ar': 'فشل معالجة رسالتك. يرجى المحاولة مرة أخرى.'
        },
        'session_error': {
            'en': 'Failed to create or retrieve chat session. Please try again.',
            'ar': 'فشل إنشاء أو استرجاع جلسة الدردشة. يرجى المحاولة مرة أخرى.'
        },
        'summary_error': {
            'en': 'Failed to generate summary. Please try again later.',
            'ar': 'فشل إنشاء الملخص. يرجى المحاولة لاحقاً.'
        },
        'summary_unavailable': {
            'en': 'Summary not available yet. Continue chatting to generate insights.',
            'ar': 'الملخص غير متوفر حالياً. استمر بالدردشة لإنشاء رؤى.'
        },
        'empty_message': {
            'en': 'Message cannot be empty.',
            'ar': 'الرسالة لا يمكن أن تكون فارغة.'
        },
        'rate_limit_error': {
            'en': 'You have exceeded the rate limit. Maximum 100 requests per minute allowed. Please try again in {seconds} seconds.',
            'ar': 'لقد تجاوزت حد معدل الطلب. يُسمح بحد أقصى 100 طلب في الدقيقة. يرجى المحاولة مرة أخرى خلال {seconds} ثانية.'
        }
    }

    @staticmethod
    def validate_language_code(code):
        """
        Validate if language code is supported.
        
        Args:
            code: Language code (e.g., 'en', 'ar')
            
        Returns:
            bool: True if valid, False otherwise
            
        Raises:
            ValueError: If language code is invalid (optional, can return False instead)
        """
        return code in LanguageService.SUPPORTED_LANGUAGES

    @staticmethod
    def get_localized_error_message(error_key, language='en', **format_kwargs):
        """
        Get localized error message.
        
        Args:
            error_key: Error message key (e.g., 'invalid_language', 'chat_error')
            language: Language code ('en' or 'ar')
            **format_kwargs: Format arguments for string interpolation
            
        Returns:
            str: Localized error message
            
        Example:
            >>> LanguageService.get_localized_error_message('rate_limit_error', 'ar', seconds=60)
            'لقد تجاوزت حد معدل الطلب...'
        """
        if error_key not in LanguageService.ERROR_MESSAGES:
            return "An error occurred."

        message = LanguageService.ERROR_MESSAGES[error_key].get(
            language,
            LanguageService.ERROR_MESSAGES[error_key].get('en', 'An error occurred.')
        )

        # Format with kwargs if provided
        if format_kwargs:
            try:
                message = message.format(**format_kwargs)
            except KeyError:
                pass  # Return unformatted if keys don't match

        return message

    @staticmethod
    def get_msa_prompt_instruction():
        """
        Get system prompt instruction for Modern Standard Arabic (MSA).
        
        This instruction ensures AI responses use formal, universally understood Arabic
        (MSA) rather than dialect-specific vernacular.
        
        Returns:
            str: System prompt instruction for MSA Arabic generation
        """
        return (
            "You are responding in Arabic. Use Modern Standard Arabic (Fusha/MSA) exclusively. "
            "Ensure your response is:\n"
            "- Formal and professional in tone\n"
            "- Free of colloquialisms, slang, or regional dialect words\n"
            "- Universally understandable across all Arabic-speaking regions\n"
            "- Grammatically correct with proper diacritics where appropriate\n"
            "Focus on clarity and accessibility for all Arabic speakers."
        )

    @staticmethod
    def get_language_display_name(language_code):
        """
        Get display name for language code.
        
        Args:
            language_code: Language code (e.g., 'en', 'ar')
            
        Returns:
            str: Display name (e.g., 'English', 'العربية')
        """
        return LanguageService.LANGUAGE_DISPLAY_NAMES.get(language_code, language_code)

    @staticmethod
    def get_ishtml_dir_attribute(language_code):
        """
        Get HTML dir attribute for proper RTL/LTR rendering.
        
        Args:
            language_code: Language code ('en' or 'ar')
            
        Returns:
            str: dir attribute value ('rtl' for Arabic, 'ltr' for English)
        """
        return 'rtl' if language_code == 'ar' else 'ltr'


__all__ = ['LanguageService']
