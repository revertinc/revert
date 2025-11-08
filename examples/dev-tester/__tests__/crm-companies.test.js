const api = require('../src/api');

describe('CRM - Companies Endpoints', () => {
  test('should list all companies', async () => {
    const response = await api.get('/crm/companies', {
      params: { pageSize: 10 },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('results');
    expect(Array.isArray(response.data.results)).toBe(true);
  });

  test('should get a single company', async () => {
    const companyId = 'test-company-id';
    const response = await api.get(`/crm/companies/${companyId}`);
    expect([200, 404]).toContain(response.status);
  });

  test('should create a company', async () => {
    const payload = {
      name: 'Test Company',
      website: 'https://example.com',
    };
    const response = await api.post('/crm/companies', payload);
    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('status');
  });
});
