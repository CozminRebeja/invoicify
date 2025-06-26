
# backend/tests/test_models.py
from app.models import Client, Invoice, ServiceItem
from datetime import date

def test_new_client(init_database):
    client = Client(name='Test Client', email='test@example.com')
    assert client.name == 'Test Client'
    assert client.email == 'test@example.com'

def test_new_invoice(init_database):
    client = Client(name='Test Client', email='test@example.com')
    init_database.session.add(client)
    init_database.session.commit()

    invoice = Invoice(
        client_id=client.id,
        invoice_number='INV-001',
        issue_date=date(2025, 6, 11),
        due_date=date(2025, 7, 11),
        status='draft'
    )
    assert invoice.invoice_number == 'INV-001'
    assert invoice.status == 'draft'

def test_invoice_total_amount(init_database):
    client = Client(name='Test Client', email='test@example.com')
    init_database.session.add(client)
    init_database.session.commit()

    invoice = Invoice(
        client_id=client.id,
        invoice_number='INV-002',
        issue_date=date(2025, 6, 11),
        due_date=date(2025, 7, 11),
    )
    
    item1 = ServiceItem(invoice=invoice, description='Web Design', quantity=10, unit_price=50.0) # subtotal = 500
    item2 = ServiceItem(invoice=invoice, description='Hosting', quantity=12, unit_price=20.0) # subtotal = 240

    init_database.session.add(invoice)
    init_database.session.add(item1)
    init_database.session.add(item2)
    init_database.session.commit()

    assert item1.subtotal == 500.0
    assert item2.subtotal == 240.0
    assert invoice.total_amount == 740.0
