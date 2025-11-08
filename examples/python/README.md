# Revert API - Python Example

Flask application demonstrating how to use the Revert API.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running

Start the Flask server:
```bash
python app.py
```

Server will run on `http://localhost:5000`

## API Endpoints

- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get a specific contact
- `POST /api/contacts` - Create a new contact
- `GET /api/companies` - List all companies
- `GET /api/connection` - Get connection details
- `GET /api/field-mappings` - Get field mappings
- `GET /health` - Health check

## Example Requests

Get contacts:
```bash
curl http://localhost:5000/api/contacts
```

Create a contact:
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'
```

Get a contact:
```bash
curl http://localhost:5000/api/contacts/contact-id
```
