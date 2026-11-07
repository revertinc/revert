import { WorkableAdapter } from './workable';
import { WorkdayAdapter } from './workday';

describe('ATS Adapters - Workable (#551) & Workday (#372)', () => {
    describe('WorkableAdapter', () => {
        const workable = new WorkableAdapter({
            apiToken: 'test_workable_token',
            subdomain: 'demo-company',
        });

        it('correctly maps Workable raw job to UnifiedJob', () => {
            const rawJob = {
                id: 98765,
                title: 'Senior Frontend Engineer',
                shortcode: 'SFENG1',
                code: 'ENG-101',
                state: 'published',
                department: 'Frontend Team',
                created_at: '2026-01-15T10:00:00Z',
                location: {
                    city: 'San Francisco',
                    country: 'United States',
                    country_code: 'US',
                    address: '100 Pine St',
                },
            };

            const unified = workable.mapJob(rawJob);

            expect(unified.id).toBe('98765');
            expect(unified.name).toBe('Senior Frontend Engineer');
            expect(unified.requisition_id).toBe('ENG-101');
            expect(unified.status).toBe('published');
            expect(unified.departments[0].name).toBe('Frontend Team');
            expect(unified.offices[0].name).toBe('San Francisco');
            expect(unified.created_at).toEqual(new Date('2026-01-15T10:00:00Z'));
        });

        it('correctly maps Workable raw candidate to UnifiedCandidate', () => {
            const rawCandidate = {
                id: 'cand_456',
                name: 'Elena Rostova',
                firstname: 'Elena',
                lastname: 'Rostova',
                headline: 'Staff Software Architect',
                email: 'elena.rostova@example.com',
                phone: '+14155552671',
                address: 'San Francisco, CA',
                created_at: '2026-02-10T14:30:00Z',
                stage: 'Interview',
                tags: ['TypeScript', 'Node.js', 'Distributed Systems'],
            };

            const unified = workable.mapCandidate(rawCandidate);

            expect(unified.id).toBe('cand_456');
            expect(unified.first_name).toBe('Elena');
            expect(unified.last_name).toBe('Rostova');
            expect(unified.title).toBe('Staff Software Architect');
            expect(unified.email_addresses[0].value).toBe('elena.rostova@example.com');
            expect(unified.phone_numbers[0].value).toBe('+14155552671');
            expect(unified.applications[0].status).toBe('Interview');
            expect(unified.tags).toContain('TypeScript');
        });
    });

    describe('WorkdayAdapter', () => {
        const workday = new WorkdayAdapter({
            apiToken: 'test_workday_token',
            host: 'impl.workday.com',
            tenant: 'acme_corp',
        });

        it('correctly maps Workday raw job posting to UnifiedJob', () => {
            const rawJob = {
                id: 'REQ-2026-09',
                jobPostingTitle: 'Principal Cloud Platform Engineer',
                status: 'Open',
                postedDate: '2026-02-01T08:00:00Z',
                supervisoryOrganization: {
                    id: 'ORG-INFRA',
                    name: 'Cloud Infrastructure',
                },
                primaryLocation: {
                    id: 'LOC-MAD',
                    name: 'Madrid Office',
                },
            };

            const unified = workday.mapJob(rawJob);

            expect(unified.id).toBe('REQ-2026-09');
            expect(unified.name).toBe('Principal Cloud Platform Engineer');
            expect(unified.requisition_id).toBe('REQ-2026-09');
            expect(unified.status).toBe('Open');
            expect(unified.departments[0].name).toBe('Cloud Infrastructure');
            expect(unified.offices[0].name).toBe('Madrid Office');
            expect(unified.created_at).toEqual(new Date('2026-02-01T08:00:00Z'));
        });

        it('correctly maps Workday raw candidate to UnifiedCandidate', () => {
            const rawCandidate = {
                id: 'WD-CAND-789',
                legalName: {
                    firstName: 'Lucas',
                    lastName: 'Vidal',
                },
                primaryEmail: 'lucas.vidal@example.com',
                primaryPhone: '+34611223344',
                currentTitle: 'Senior Site Reliability Engineer',
                createdDate: '2026-03-01T12:00:00Z',
                stage: 'Screening',
            };

            const unified = workday.mapCandidate(rawCandidate);

            expect(unified.id).toBe('WD-CAND-789');
            expect(unified.first_name).toBe('Lucas');
            expect(unified.last_name).toBe('Vidal');
            expect(unified.title).toBe('Senior Site Reliability Engineer');
            expect(unified.email_addresses[0].value).toBe('lucas.vidal@example.com');
            expect(unified.phone_numbers[0].value).toBe('+34611223344');
            expect(unified.applications[0].status).toBe('Screening');
        });
    });
});
