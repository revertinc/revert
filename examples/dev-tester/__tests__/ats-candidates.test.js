const api = require('../src/api');

describe('ATS - Candidates Endpoints', () => {
  test('should list all candidates', async () => {
    const response = await api.get('/ats/candidates', {
      params: { pageSize: 10 },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('results');
    expect(Array.isArray(response.data.results)).toBe(true);
  });

  test('should get a single candidate', async () => {
    const candidateId = 'test-candidate-id';
    const response = await api.get(`/ats/candidates/${candidateId}`);
    expect([200, 404]).toContain(response.status);
  });
});
