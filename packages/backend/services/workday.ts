import axios from 'axios';
import { env } from '../config';

const client = axios.create({
  baseURL: env.WORKDAY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getWorkdayData() {
  try {
    const response = await client.get('/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching Workday data:', error);
    throw error;
  }
}

export async function createWorkdayConnection() {
  try {
    const response = await client.post('/connections', {
      clientId: env.WORKDAY_CLIENT_ID,
      clientSecret: env.WORKDAY_CLIENT_SECRET,
      redirectUri: env.WORKDAY_REDIRECT_URI,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Workday connection:', error);
    throw error;
  }
}
