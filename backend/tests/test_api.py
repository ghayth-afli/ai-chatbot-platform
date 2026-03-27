import datetime

import pytest
from django.test import Client


@pytest.mark.django_db
def test_health_endpoint_returns_200():
    client = Client()
    response = client.get('/api/health/')

    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['database'] == 'connected'
    assert 'timestamp' in data


@pytest.mark.django_db
def test_health_endpoint_returns_timestamp():
    client = Client()
    response = client.get('/api/health/')

    timestamp = response.json().get('timestamp')
    assert timestamp is not None
    datetime.datetime.fromisoformat(timestamp)
