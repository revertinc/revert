# Revert API - Node.js Example

Node.js Express server demonstrating how to use the Revert API.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running

Start the server:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

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
curl http://localhost:3000/api/contacts
```

Create a contact:
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'
```

Get a contact:
```bash
curl http://localhost:3000/api/contacts/contact-id
```
