from datetime import datetime, timezone

from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):
	"""Basic health check to verify API and database connectivity."""
	try:
		with connection.cursor() as cursor:
			cursor.execute('SELECT 1')

		return Response({
			'status': 'healthy',
			'database': 'connected',
			'timestamp': datetime.now(timezone.utc).isoformat(),
		})
	except Exception as exc:  # pragma: no cover - rare failure mode
		return Response({
			'status': 'error',
			'message': f'Database connection failed: {exc}',
			'timestamp': datetime.now(timezone.utc).isoformat(),
		}, status=503)
