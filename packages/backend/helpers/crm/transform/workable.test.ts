import { preprocessUnifyObject } from './preprocess';
import { disunifyAtsObject } from './disunify';
import { AtsStandardObjects } from '../../../constants/common';
import { TP_ID } from '@prisma/client';

jest.mock('../../logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

jest.mock('./transformSchemaMapping', () => ({
    transformModelToFieldMapping: jest
        .fn()
        .mockImplementation(async ({ unifiedObj }: { unifiedObj: unknown }) => unifiedObj || {}),
    transformFieldMappingToModel: jest.fn().mockImplementation(async ({ obj }: { obj: unknown }) => obj || {}),
}));

describe('Workable Transforms & Normalizers', () => {
    describe('preprocessUnifyObject', () => {
        it('normalizes Workable candidate into unified candidate schema', () => {
            const raw = {
                id: 'cand_123',
                name: 'Jane Mary Doe',
                headline: 'Senior Lead Architect',
                email: 'jane.doe@example.com',
                phone: '+1-555-0199',
                address: '100 Market St, San Francisco, CA',
                account: { subdomain: 'acme', name: 'Acme Technologies' },
                job: { shortcode: 'ARCH001', title: 'Lead Architect' },
                stage: 'Interviewing',
                image_url: 'https://images.workable.com/photo.jpg',
                tags: ['engineering', 'top-talent'],
                created_at: '2024-05-01T10:00:00Z',
                updated_at: '2024-05-03T15:30:00Z',
            };

            const unified: any = preprocessUnifyObject({
                obj: raw,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.candidate,
            });

            expect(unified.id).toBe('cand_123');
            expect(unified.first_name).toBe('Jane');
            expect(unified.last_name).toBe('Mary Doe');
            expect(unified.title).toBe('Senior Lead Architect');
            expect(unified.company).toBe('Acme Technologies');
            expect(unified.email_addresses).toEqual([{ value: 'jane.doe@example.com', type: undefined }]);
            expect(unified.phone_numbers).toEqual([{ value: '+1-555-0199', type: undefined }]);
            expect(unified.addresses).toEqual([{ value: '100 Market St, San Francisco, CA', type: undefined }]);
            expect(unified.application_ids).toEqual(['ARCH001']);
            expect(unified.applications[0]).toEqual({
                id: 'cand_123',
                candidate_id: 'cand_123',
                job_post_id: 'ARCH001',
                status: undefined,
                current_stage: { name: 'Interviewing' },
                applied_at: undefined,
            });
            expect(unified.photo_url).toBe('https://images.workable.com/photo.jpg');
            expect(unified.last_activity).toBe('2024-05-03T15:30:00Z');
        });

        it('normalizes Workable job into unified job schema', () => {
            const raw = {
                id: 'job_456',
                shortcode: 'SR-DEV-01',
                title: 'Senior Fullstack Engineer',
                state: 'published',
                confidential: false,
                department: 'Platform Engineering',
                description: '<p>Join our platform core team</p>',
                created_at: '2024-04-01T08:00:00Z',
                updated_at: '2024-04-10T12:00:00Z',
            };

            const unified: any = preprocessUnifyObject({
                obj: raw,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.job,
            });

            expect(unified.id).toBe('SR-DEV-01');
            expect(unified.name).toBe('Senior Fullstack Engineer');
            expect(unified.status).toBe('open');
            expect(unified.departments).toEqual([{ name: 'Platform Engineering' }]);
            expect(unified.notes).toBe('<p>Join our platform core team</p>');
        });

        it('maps closed job state correctly', () => {
            const raw = {
                shortcode: 'CLOSED-01',
                title: 'Intern',
                state: 'closed',
            };

            const unified: any = preprocessUnifyObject({
                obj: raw,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.job,
            });

            expect(unified.status).toBe('closed');
        });

        it('normalizes Workable department', () => {
            const raw = {
                id: 105,
                name: 'Product Design',
            };

            const unified: any = preprocessUnifyObject({
                obj: raw,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.department,
            });

            expect(unified.id).toBe('105');
            expect(unified.name).toBe('Product Design');
        });

        it('normalizes Workable offer and extracts start date from document_variables', () => {
            const raw = {
                id: 'off_789',
                state: 'accepted',
                candidate: { id: 'cand_123' },
                job: { shortcode: 'SR-DEV-01' },
                document_variables: [
                    {
                        document_variable: { name: 'Start Date', slug: 'start_date' },
                        value: { body: '2024-06-01' },
                    },
                ],
                updated_at: '2024-05-15T18:00:00Z',
            };

            const unified: any = preprocessUnifyObject({
                obj: raw,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.offer,
            });

            expect(unified.id).toBe('off_789');
            expect(unified.status).toBe('accepted');
            expect(unified.candidate_id).toBe('cand_123');
            expect(unified.application_id).toBe('cand_123');
            expect(unified.starts_at).toBe('2024-06-01');
            expect(unified.resolved_at).toBe('2024-05-15T18:00:00Z');
        });
    });

    describe('disunifyAtsObject', () => {
        it('builds the Workable candidate creation payload with required keys', async () => {
            const candidateInput = {
                first_name: 'John',
                last_name: 'Smith',
                email_addresses: [{ value: 'john.smith@example.com', type: undefined }],
                phone_numbers: [{ value: '+15550001', type: undefined }],
                addresses: [{ value: '456 Main St', type: undefined }],
                title: 'Staff Engineer',
                summary: 'Experienced distributed systems engineer',
                tags: ['backend', 'golang'],
            };

            const disunified: any = await disunifyAtsObject({
                obj: candidateInput,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.candidate,
            });

            expect(disunified.candidate).toEqual({
                name: 'John Smith',
                firstname: 'John',
                lastname: 'Smith',
                email: 'john.smith@example.com',
                phone: '+15550001',
                address: '456 Main St',
                headline: 'Staff Engineer',
                summary: 'Experienced distributed systems engineer',
                tags: ['backend', 'golang'],
            });
            // Job shortcode must never be placed inside the candidate payload body (it belongs in the URL)
            expect(JSON.stringify(disunified)).not.toContain('shortcode');
        });

        it('derives firstname and lastname when only full name is provided', async () => {
            const disunified: any = await disunifyAtsObject({
                obj: { name: 'Ada Byron Lovelace' },
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.candidate,
            });

            expect(disunified.candidate.firstname).toBe('Ada');
            expect(disunified.candidate.lastname).toBe('Byron Lovelace');
            expect(disunified.candidate.name).toBe('Ada Byron Lovelace');
        });
    });
});
