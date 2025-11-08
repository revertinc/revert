require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const api = axios.create({
  baseURL: process.env.REVERT_API_BASE_URL || 'http://localhost:4001',
  headers: {
    'x-revert-api-token': process.env.REVERT_API_TOKEN,
    'x-revert-t-id': process.env.REVERT_TENANT_ID,
  },
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const response = await api.get('/crm/contacts', {
      params: {
        pageSize: req.query.pageSize || 10,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get a single contact
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const response = await api.get(`/crm/contacts/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Create a contact
app.post('/api/contacts', express.json(), async (req, res) => {
  try {
    const response = await api.post('/crm/contacts', {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      additional: req.body.additional || {},
    });
    res.status(201).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const response = await api.get('/crm/companies', {
      params: {
        pageSize: req.query.pageSize || 10,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get connection details
app.get('/api/connection', async (req, res) => {
  try {
    const response = await api.get('/connection');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get field mappings
app.get('/api/field-mappings', async (req, res) => {
  try {
    const response = await api.get('/field-mapping/mappings');
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Revert API example server running on http://localhost:${PORT}`);
});
