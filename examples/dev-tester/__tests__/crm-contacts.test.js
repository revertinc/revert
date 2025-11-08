const api = require('../src/api');

describe('CRM - Contacts Endpoints', () => {
  test('should list all contacts', async () => {
    const response = await api.get('/crm/contacts', {
      params: { pageSize: 10 },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('results');
    expect(Array.isArray(response.data.results)).toBe(true);
  });

  test('should get a single contact', async () => {
    const contactId = 'test-contact-id';
    const response = await api.get(`/crm/contacts/${contactId}`);
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('result');
    }
  });

  test('should create a contact', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
    };
    const response = await api.post('/crm/contacts', payload);
    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('status');
  });
});
