import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkdayAtsService } from './workday.service.ts';

test('WorkdayAtsService refreshes OAuth2 token, lists job requisitions, and creates candidates', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method });
    if (url.includes('/oauth2/')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'wd_oauth_tok_99' }) };
    }
    if (url.includes('/jobRequisitions')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'REQ-501',
              descriptor: 'Principal Distributed Systems Engineer',
              status: { descriptor: 'Open' },
              primaryLocation: { descriptor: 'San Francisco, CA' },
            },
          ],
        }),
      };
    }
    return {
      ok: true,
      status: 201,
      json: async () => ({
        id: 'CAND-881',
        name: { givenName: 'Grace', familyName: 'Hopper' },
        contactData: { emailAddress: 'grace@navy.mil' },
        jobApplication: { jobRequisition: { id: 'REQ-501' }, stage: { descriptor: 'Screen' } },
      }),
    };
  };

  const service = new WorkdayAtsService({
    host: 'wd5-services1.myworkday.com',
    tenant: 'acme_corp',
    clientId: 'cid',
    clientSecret: 'csec',
    refreshToken: 'rtok',
    fetchImpl,
  });

  const jobs = await service.listJobs({ limit: 10 });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].id, 'REQ-501');
  assert.equal(jobs[0].status, 'OPEN');

  const created = await service.createCandidate({
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@navy.mil',
    jobRequisitionId: 'REQ-501',
  });
  assert.equal(created.id, 'CAND-881');
  assert.equal(created.jobShortcode, 'REQ-501');
  assert.equal(calls.length, 3);
});
