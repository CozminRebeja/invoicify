[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Zj5S3O5Q)

# Invoicify - Invoice Tracker

## Key Features

- **Dashboard Overview:** An at-a-glance view of key financial metrics, including annual revenue, outstanding revenue, and a monthly income chart.
- **Client Management:** Full CRUD functionality for managing your client list.
- **Invoice Management:**
  - Create, view, edit, and delete invoices with multiple line items.
  - Dynamically calculate totals on the fly.
  - Update invoice status (e.g., Draft, Unpaid, Paid).
- **PDF Generation:** Download professional, print-ready PDF versions of any invoice.
- **Quick Actions:** Quickly generate a new invoice for any client directly from the dashboard.
- **Dynamic UI:** Features a collapsible sidebar and dynamic breadcrumbs for easy navigation.

#### **Backend**

- **Framework:** Flask
- **Database ORM:** SQLAlchemy
- **Database:** SQLite (for development)
- **PDF Generation:** WeasyPrint
- **API:** RESTful API principles with JSON responses
- **CORS:** `flask-cors` for handling cross-origin requests from the frontend

#### **Frontend**

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charting:** Recharts
- **Icons:** lucide-react

---

## Project Setup and Installation

Follow these steps to get the project running on your local machine.

### Prerequisites

- Python 3.8+ and `pip`
- Node.js (LTS version recommended) and `npm`
- Homebrew (for macOS users to install PDF dependencies)

### 1. Clone the Repository

```bash
git clone git@github.com:IMC-UAS-Krems/assignment-2-CozminRebeja.git
cd git@github.com:IMC-UAS-Krems/assignment-2-CozminRebeja.git
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

#### **macOS Specific (for PDF Generation)**

If you are on macOS, you need to install WeasyPrint's system dependencies using Homebrew. This is required to prevent server crashes.

```bash
brew install pango gdk-pixbuf libffi
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory from the project root
cd frontend

# Install Node.js dependencies
npm install

# Create an environment file for local development
touch .env.local

# Add the backend API URL to the .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=[http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)" > .env.local
```

---

## Running the Application

You will need to run the backend and frontend servers in two separate terminal windows.

#### **Terminal 1: Start the Backend**

```bash
# Navigate to the backend directory
cd backend

# Activate the virtual environment
source venv/bin/activate

# Run the Flask application
flask run
```

The backend server should now be running on `http://127.0.0.1:5000`.

#### **Terminal 2: Start the Frontend**

```bash
# Navigate to the frontend directory
cd frontend

# Run the Next.js development server
npm run dev
```

The frontend should now be running on `http://localhost:3000`. Open this URL in your browser to use the application.
