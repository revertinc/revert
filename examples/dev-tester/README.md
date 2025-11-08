# Revert API - Developer Test Harness

Integration test suite for Revert API endpoints using Jest.

## Setup

1. Copy `.env.example` to `.env` and update with your credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with verbose output:
```bash
npm run test:verbose
```

## Test Coverage

The test suite includes smoke tests for:

- **Field Mappings**: Get config, get mappings, create mapping
- **Connections**: Get connection, list all, get integration status
- **CRM Contacts**: List, get, create
- **CRM Companies**: List, get, create
- **ATS Candidates**: List, get
- **Tickets**: List, get

## Environment Variables

Set `REVERT_API_BASE_URL` to point to your API instance (default: `http://localhost:4001`)

```bash
REVERT_API_BASE_URL=http://localhost:4001
REVERT_API_TOKEN=your-api-token
REVERT_TENANT_ID=your-tenant-id
```

## Adding New Tests

Add test files in `__tests__/` directory with `.test.js` suffix.

Example:
```javascript
const api = require('../src/api');

describe('My Endpoint', () => {
  test('should do something', async () => {
    const response = await api.get('/my-endpoint');
    expect(response.status).toBe(200);
  });
});
```
