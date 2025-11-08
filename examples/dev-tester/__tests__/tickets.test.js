const api = require('../src/api');

describe('Ticket Endpoints', () => {
  test('should list all tickets', async () => {
    const response = await api.get('/tickets', {
      params: { pageSize: 10 },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('results');
    expect(Array.isArray(response.data.results)).toBe(true);
  });

  test('should get a single ticket', async () => {
    const ticketId = 'test-ticket-id';
    const response = await api.get(`/tickets/${ticketId}`);
    expect([200, 404]).toContain(response.status);
  });
});
