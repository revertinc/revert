import test from 'node:test';
import assert from 'node:assert/strict';

function buildWorkdayRestUrl(host, tenant, service = 'recruiting/v1') {
    const cleanHost = String(host || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const cleanTenant = String(tenant || '').trim();
    if (!cleanHost || !cleanTenant) throw new Error('Workday host and tenant are required');
    return `https://${cleanHost}/ccx/api/${service}/${cleanTenant}`;
}

function unifyWorkdayJobRequisition(raw) {
    const statusDescriptor = String(raw.jobRequisitionStatus?.descriptor || 'Open').toLowerCase();
    const status = statusDescriptor.includes('close') ? 'CLOSED' : 'OPEN';
    return {
        id: String(raw.id),
        title: String(raw.jobPostingTitle || raw.descriptor),
        status,
        department: raw.supervisoryOrganization?.descriptor,
        location: raw.primaryLocation?.descriptor,
    };
}

function unifyWorkdayCandidate(raw) {
    const parts = String(raw.name?.descriptor || '').trim().split(/\s+/);
    return {
        id: String(raw.id),
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
        email: raw.email,
        jobId: raw.jobRequisition?.id,
    };
}

test('buildWorkdayRestUrl constructs tenant-scoped Workday REST endpoint', () => {
    assert.equal(
        buildWorkdayRestUrl('wd5-services1.myworkday.com', 'acme_corp'),
        'https://wd5-services1.myworkday.com/ccx/api/recruiting/v1/acme_corp'
    );
    assert.throws(() => buildWorkdayRestUrl('', 'acme'), /Workday host and tenant are required/);
});

test('unifyWorkdayJobRequisition maps Workday requisition to unified ATS Job', () => {
    const job = unifyWorkdayJobRequisition({
        id: ' wd_req_42',
        jobPostingTitle: 'Staff Distributed Systems Engineer',
        jobRequisitionStatus: { descriptor: 'Open' },
        supervisoryOrganization: { descriptor: 'Core Infrastructure' },
        primaryLocation: { descriptor: 'San Francisco, CA' },
    });
    assert.equal(job.title, 'Staff Distributed Systems Engineer');
    assert.equal(job.status, 'OPEN');
    assert.equal(job.department, 'Core Infrastructure');
});

test('unifyWorkdayCandidate parses descriptor name and requisition link', () => {
    const cand = unifyWorkdayCandidate({
        id: 'wd_cand_7',
        name: { descriptor: 'Grace Hopper' },
        email: 'grace@navy.mil',
        jobRequisition: { id: 'wd_req_42' },
    });
    assert.equal(cand.firstName, 'Grace');
    assert.equal(cand.lastName, 'Hopper');
    assert.equal(cand.jobId, 'wd_req_42');
});
