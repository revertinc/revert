import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkableAtsService } from './workable.service.ts';

test('WorkableAtsService lists jobs, lists candidates, and creates a candidate in Unified ATS format', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : null });

    if (url.includes('/jobs/ENG01/candidates') && init.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          candidate: {
            id: 'cand_991',
            firstname: 'Ada',
            lastname: 'Lovelace',
            name: 'Ada Lovelace',
            email: 'ada@analytical.engine',
            stage: 'Applied',
            job: { shortcode: 'ENG01' },
            disqualified: false,
          },
        }),
      };
    }

    if (url.includes('/jobs')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          jobs: [
            {
              id: 'job_101',
              title: 'Staff Backend Engineer',
              shortcode: 'ENG01',
              state: 'published',
              department: 'Engineering',
              location: { location_str: 'Remote' },
            },
          ],
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            id: 'cand_100',
            firstname: 'Alan',
            lastname: 'Turing',
            email: 'alan@bletchley.uk',
            stage: 'Interview',
            job: { shortcode: 'ENG01' },
          },
        ],
      }),
    };
  };

  const service = new WorkableAtsService({
    subdomain: 'acme-corp',
    accessToken: 'wk_live_token_123',
    fetchImpl,
  });

  const jobs = await service.listJobs({ state: 'published' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].status, 'OPEN');
  assert.equal(jobs[0].shortcode, 'ENG01');

  const candidates = await service.listCandidates({ shortcode: 'ENG01' });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].email, 'alan@bletchley.uk');

  const created = await service.createCandidate({
    jobShortcode: 'ENG01',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@analytical.engine',
  });
  assert.equal(created.id, 'cand_991');
  assert.equal(created.jobShortcode, 'ENG01');
  assert.equal(requests.length, 3);
});
