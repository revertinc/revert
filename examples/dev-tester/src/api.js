require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.REVERT_API_BASE_URL || 'http://localhost:4001';
const API_TOKEN = process.env.REVERT_API_TOKEN || 'test-api-token';
const TENANT_ID = process.env.REVERT_TENANT_ID || 'test-tenant-id';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-revert-api-token': API_TOKEN,
    'x-revert-t-id': TENANT_ID,
  },
  validateStatus: () => true, // Don't throw on any status code
});

module.exports = api;
