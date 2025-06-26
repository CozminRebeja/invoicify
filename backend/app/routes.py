# backend/app/routes.py
from flask import Blueprint, request, jsonify, make_response, render_template
from .models import db, Client, Invoice, ServiceItem 
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from weasyprint import HTML, CSS

main_bp = Blueprint('main', __name__)

# --- Client Routes ---
@main_bp.route('/clients', methods=['POST'])
def create_client():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Missing name or email'}), 400
    
    if Client.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    new_client = Client(name=data['name'], email=data['email'])
    db.session.add(new_client)
    db.session.commit()
    return jsonify(new_client.to_dict()), 201

@main_bp.route('/clients', methods=['GET'])
def get_clients():
    limit = request.args.get('limit', type=int)
    query = Client.query.order_by(Client.name)
    if limit:
        query = query.limit(limit)
    clients = query.all()
    return jsonify([client.to_dict() for client in clients]), 200

@main_bp.route('/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    client = db.session.get(Client, client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    return jsonify(client.to_dict()), 200

@main_bp.route('/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    client = db.session.get(Client, client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    data = request.get_json()
    if 'name' in data:
        client.name = data['name']
    if 'email' in data:
        existing_client = Client.query.filter(Client.email == data['email'], Client.id != client_id).first()
        if existing_client:
            return jsonify({'error': 'New email already exists for another client'}), 400
        client.email = data['email']
    
    db.session.commit()
    return jsonify(client.to_dict()), 200

@main_bp.route('/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    client = db.session.get(Client, client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    db.session.delete(client)
    db.session.commit()
    return jsonify({'message': 'Client deleted successfully'}), 200


# --- Invoice Routes ---
@main_bp.route('/invoices', methods=['POST'])
def create_invoice():
    data = request.get_json()
    required_fields = ['client_id', 'issue_date', 'due_date', 'service_items']
    if not all(k in data for k in required_fields):
        missing = [k for k in required_fields if k not in data]
        return jsonify({'error': f'Missing required invoice data: {", ".join(missing)}'}), 400

    client = db.session.get(Client, int(data['client_id'])) 
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    if data.get('invoice_number') and Invoice.query.filter_by(invoice_number=data['invoice_number']).first():
        return jsonify({'error': 'Invoice number already exists'}), 400
    
    try:
        issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid date format. Use YYYY-MM-DD. Error: {str(e)}'}), 400

    new_invoice = Invoice(
        client_id=int(data['client_id']),
        invoice_number=data.get('invoice_number'),
        issue_date=issue_date,
        due_date=due_date,
        status=data.get('status', 'draft')
    )
    db.session.add(new_invoice)
    
    for item_data in data.get('service_items', []):
        if not all(k in item_data for k in ('description', 'quantity', 'unit_price')):
            db.session.rollback()
            return jsonify({'error': 'Missing data for a service item (description, quantity, unit_price)'}), 400
        
        service_item = ServiceItem(
            invoice=new_invoice,
            description=item_data['description'],
            quantity=float(item_data['quantity']),
            unit_price=float(item_data['unit_price'])
        )
        db.session.add(service_item)

    db.session.commit()
    return jsonify(new_invoice.to_dict()), 201

@main_bp.route('/invoices', methods=['GET'])
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.issue_date.desc()).all()
    return jsonify([invoice.to_dict() for invoice in invoices]), 200

@main_bp.route('/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    invoice = db.session.get(Invoice, invoice_id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    return jsonify(invoice.to_dict()), 200

@main_bp.route('/invoices/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    invoice = db.session.get(Invoice, invoice_id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    data = request.get_json()
    db.session.commit()
    return jsonify(invoice.to_dict()), 200

@main_bp.route('/invoices/<int:invoice_id>/status', methods=['PATCH'])
def update_invoice_status(invoice_id):
    invoice = db.session.get(Invoice, invoice_id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404

    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'error': 'New status not provided'}), 400

    allowed_statuses = ['paid', 'unpaid', 'overdue']
    if new_status not in allowed_statuses:
        return jsonify({'error': f'Invalid status: {new_status}'}), 400

    invoice.status = new_status
    db.session.commit()
    return jsonify(invoice.to_dict()), 200

@main_bp.route('/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    invoice = db.session.get(Invoice, invoice_id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({'message': 'Invoice deleted successfully'}), 200

@main_bp.route('/invoices/<int:invoice_id>/pdf', methods=['GET'])
def download_invoice_pdf(invoice_id):
    invoice = db.session.get(Invoice, invoice_id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    your_company_details = { "name": "Your Company LLC", "address_line1": "123 Main St", "email": "contact@yourcompany.com" }
    try:
        html_string = render_template('invoice_pdf.html', invoice=invoice, your_company=your_company_details)
        pdf_bytes = HTML(string=html_string).write_pdf()
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=invoice_{invoice.invoice_number or invoice.id}.pdf'
        return response
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({'error': 'Could not generate PDF.'}), 500
    

# --- Dashboard Stats Route ---
@main_bp.route('/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    today = datetime.now(timezone.utc).date()
    current_year = today.year

    # Calculate yearly revenue
    yearly_revenue_query = db.session.query(
        func.sum(ServiceItem.quantity * ServiceItem.unit_price)
    ).join(Invoice).filter(
        Invoice.status == 'paid',
        func.extract('year', Invoice.issue_date) == current_year
    ).scalar()
    yearly_revenue = yearly_revenue_query or 0.0

    outstanding_query = db.session.query(
        func.sum(ServiceItem.quantity * ServiceItem.unit_price)
    ).join(Invoice).filter(
        Invoice.status.in_(['unpaid', 'overdue', 'sent'])
    ).scalar()
    total_outstanding = outstanding_query or 0.0

    # Get total clients
    total_clients = db.session.query(func.count(Client.id)).scalar()

    # Monthly revenue 12 mon
    monthly_revenue_data = []
    for i in range(12):
        target_month_date = today - timedelta(days=i * 30)
        start_of_month = target_month_date.replace(day=1)
        start_of_next_month = (start_of_month + timedelta(days=32)).replace(day=1)
        
        month_name = start_of_month.strftime("%b")

        revenue_in_month = db.session.query(
            func.sum(ServiceItem.quantity * ServiceItem.unit_price)
        ).join(Invoice).filter(
            Invoice.status == 'paid',
            Invoice.issue_date >= start_of_month,
            Invoice.issue_date < start_of_next_month
        ).scalar() or 0.0
        
        monthly_revenue_data.append({'name': month_name, 'total': float(revenue_in_month)})
    
    monthly_revenue_data.reverse()
    
    stats = {
        'yearly_revenue': float(yearly_revenue),
        'total_outstanding': float(total_outstanding),
        'total_clients': total_clients,
        'monthly_revenue': monthly_revenue_data,
    }

    return jsonify(stats)
