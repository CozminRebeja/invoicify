# backend/tests/test_routes.py
import json
from app.models import Client, Invoice, ServiceItem
from datetime import date

def test_get_clients_empty(test_client, init_database):
    response = test_client.get('/api/clients')
    assert response.status_code == 200
    assert response.json == []

def test_create_client(test_client, init_database):
    client_data = {'name': 'New Client', 'email': 'new@client.com'}
    response = test_client.post('/api/clients', data=json.dumps(client_data), content_type='application/json')
    assert response.status_code == 201
    assert response.json['name'] == 'New Client'

    client = Client.query.filter_by(email='new@client.com').first()
    assert client is not None
    assert client.name == 'New Client'

def test_create_client_duplicate_email(test_client, init_database):
    client = Client(name='Existing Client', email='existing@client.com')
    init_database.session.add(client)
    init_database.session.commit()

    duplicate_data = {'name': 'Another Client', 'email': 'existing@client.com'}
    response = test_client.post('/api/clients', data=json.dumps(duplicate_data), content_type='application/json')
    assert response.status_code == 400
    assert 'Email already exists' in response.json['error']

def test_create_invoice(test_client, init_database):
    client = Client(name='Invoice Client', email='invoice@client.com')
    init_database.session.add(client)
    init_database.session.commit()

    invoice_data = {
        "client_id": client.id,
        "invoice_number": "TEST-001",
        "issue_date": "2025-06-11",
        "due_date": "2025-07-11",
        "service_items": [
            {"description": "Test Service", "quantity": 1, "unit_price": 100}
        ]
    }
    response = test_client.post('/api/invoices', data=json.dumps(invoice_data), content_type='application/json')
    assert response.status_code == 201
    assert response.json['invoice_number'] == 'TEST-001'
    assert response.json['total_amount'] == 100

def test_get_single_invoice(test_client, init_database):
    client = Client(name='Another Client', email='another@client.com')
    invoice = Invoice(
        client=client,
        invoice_number='GET-ME',
        issue_date=date.today(),
        due_date=date.today()
    )
    init_database.session.add_all([client, invoice])
    init_database.session.commit()

    response = test_client.get(f'/api/invoices/{invoice.id}')
    assert response.status_code == 200
    assert response.json['invoice_number'] == 'GET-ME'
    assert response.json['client_name'] == 'Another Client'

def test_update_invoice_status(test_client, init_database):
    client = Client(name='Status Client', email='status@client.com')
    invoice = Invoice(
        client=client,
        invoice_number='STATUS-UPDATE',
        issue_date=date.today(),
        due_date=date.today(),
        status='draft'
    )
    init_database.session.add_all([client, invoice])
    init_database.session.commit()

    assert invoice.status == 'draft'

    response = test_client.patch(f'/api/invoices/{invoice.id}/status', data=json.dumps({'status': 'paid'}), content_type='application/json')
    assert response.status_code == 200
    assert response.json['status'] == 'paid'
