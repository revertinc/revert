const api = require('../src/api');

describe('Field Mapping Endpoints', () => {
  test('should get field mapping config', async () => {
    const response = await api.get('/field-mapping');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('canAddCustomMapping');
  });

  test('should get field mappings', async () => {
    const response = await api.get('/field-mapping/mappings');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tpId');
    expect(response.data).toHaveProperty('mappings');
  });

  test('should create field mapping', async () => {
    const payload = {
      standardMappings: [
        {
          sourceFieldName: 'firstName',
          targetFieldName: 'first_name',
          object: 'contact',
        },
      ],
      customMappings: [],
    };
    const response = await api.post('/field-mapping', payload);
    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('status');
  });
});
