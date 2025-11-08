const api = require('../src/api');

describe('Connection Endpoints', () => {
  test('should get connection', async () => {
    const response = await api.get('/connection');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tp_id');
  });

  test('should get all connections', async () => {
    const response = await api.get('/connection/all');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should get integration status', async () => {
    const publicToken = 'test-public-token';
    const response = await api.get(`/connection/integration-status/${publicToken}`, {
      params: { tenantId: 'test-tenant' },
    });
    expect([200, 404, 401]).toContain(response.status);
  });
});
