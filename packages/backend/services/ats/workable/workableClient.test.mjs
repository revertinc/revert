import test from 'node:test';
import assert from 'node:assert/strict';
import {
    WorkableATSClient,
    buildWorkableBaseUrl,
    mapWorkableCandidate,
    mapWorkableJob,
} from './workableClient.ts';

test('buildWorkableBaseUrl sanitizes subdomain and rejects empty values', () => {
    assert.equal(buildWorkableBaseUrl('Acme-Corp'), 'https://acme-corp.workable.com/spi/v3');
    assert.throws(() => buildWorkableBaseUrl('   '), /subdomain is required/i);
});

test('maps Workable job & candidate responses to Revert unified models', () => {
    const job = mapWorkableJob({
        shortcode: 'ENG01',
        title: 'Senior Backend Engineer',
        state: 'published',
        department: 'Engineering',
        location: { city: 'Austin', region: 'TX', country: 'US' },
        created_at: '2026-01-10T00:00:00Z',
    });
    assert.equal(job.id, 'ENG01');
    assert.equal(job.location, 'Austin, TX, US');

    const cand = mapWorkableCandidate({
        id: 'cand_99',
        firstname: 'Ada',
        lastname: 'Lovelace',
        email: 'ada@example.com',
        stage: 'Interview',
        job: { shortcode: 'ENG01' },
    });
    assert.equal(cand.firstName, 'Ada');
    assert.equal(cand.jobShortcode, 'ENG01');
});

test('WorkableATSClient lists jobs with pagination and creates candidates via Bearer auth', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
        calls.push({ url, method: init?.method || 'GET', auth: init?.headers?.Authorization });
        if (url.endsWith('/jobs?state=published')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    jobs: [{ shortcode: 'J1', title: 'Staff Engineer', state: 'published' }],
                    paging: { next: 'https://acme.workable.com/spi/v3/jobs?since_id=J1' },
                }),
            };
        }
        return {
            ok: true,
            status: 201,
            json: async () => ({
                candidate: { id: 'c1', firstname: 'Grace', lastname: 'Hopper', email: 'grace@navy.mil' },
            }),
        };
    };

    const client = new WorkableATSClient({
        subdomain: 'acme',
        accessToken: 'wk_test_token',
        fetchImpl: mockFetch,
    });

    const jobs = await client.listJobs('published');
    assert.equal(jobs.results.length, 1);
    assert.equal(jobs.results[0].id, 'J1');
    assert.equal(jobs.next, 'https://acme.workable.com/spi/v3/jobs?since_id=J1');
    assert.equal(calls[0].auth, 'Bearer wk_test_token');

    const created = await client.createCandidate('J1', {
        firstname: 'Grace',
        lastname: 'Hopper',
        email: 'grace@navy.mil',
    });
    assert.equal(created.id, 'c1');
    assert.equal(calls[1].method, 'POST');
});
