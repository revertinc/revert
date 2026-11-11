import test from 'node:test';
import assert from 'node:assert/strict';

function buildWorkableBaseUrl(subdomain) {
    const clean = String(subdomain || '').trim().replace(/\.workable\.com$/i, '');
    if (!clean) throw new Error('Workable subdomain is required');
    return `https://${clean}.workable.com/spi/v3`;
}

function unifyWorkableJob(raw) {
    const stateMap = { published: 'OPEN', closed: 'CLOSED', draft: 'DRAFT', archived: 'ARCHIVED' };
    return {
        id: String(raw.shortcode || raw.id || ''),
        title: String(raw.title || ''),
        status: stateMap[String(raw.state || 'draft').toLowerCase()] || 'DRAFT',
        department: raw.department,
        location: raw.location?.location_str,
    };
}

function unifyWorkableCandidate(raw) {
    return {
        id: String(raw.id),
        firstName: raw.firstname,
        lastName: raw.lastname,
        email: raw.email,
        jobId: raw.job?.shortcode,
    };
}

function disunifyWorkableCandidate(input) {
    return {
        sourced: Boolean(input.sourced ?? true),
        candidate: {
            firstname: input.firstName,
            lastname: input.lastName,
            name: `${input.firstName} ${input.lastName}`.trim(),
            email: input.email,
        },
    };
}

test('buildWorkableBaseUrl normalizes subdomain to SPI v3 base URL', () => {
    assert.equal(buildWorkableBaseUrl('acme'), 'https://acme.workable.com/spi/v3');
    assert.equal(buildWorkableBaseUrl('acme.workable.com'), 'https://acme.workable.com/spi/v3');
    assert.throws(() => buildWorkableBaseUrl(''), /Workable subdomain is required/);
});

test('unifyWorkableJob maps Workable job payload to Revert UnifiedAtsJob', () => {
    const unified = unifyWorkableJob({
        shortcode: 'ENG-101',
        title: 'Senior Backend Engineer',
        state: 'published',
        department: 'Engineering',
        location: { location_str: 'Remote, US' },
    });
    assert.equal(unified.id, 'ENG-101');
    assert.equal(unified.status, 'OPEN');
    assert.equal(unified.department, 'Engineering');
    assert.equal(unified.location, 'Remote, US');
});

test('unifyWorkableCandidate and disunifyWorkableCandidate round-trip candidate fields', () => {
    const c = unifyWorkableCandidate({
        id: 'cand_99',
        firstname: 'Ada',
        lastname: 'Lovelace',
        email: 'ada@analytical.engine',
        job: { shortcode: 'ENG-101' },
    });
    assert.equal(c.id, 'cand_99');
    assert.equal(c.firstName, 'Ada');
    assert.equal(c.jobId, 'ENG-101');

    const payload = disunifyWorkableCandidate(c);
    assert.equal(payload.sourced, true);
    assert.equal(payload.candidate.name, 'Ada Lovelace');
    assert.equal(payload.candidate.email, 'ada@analytical.engine');
});
