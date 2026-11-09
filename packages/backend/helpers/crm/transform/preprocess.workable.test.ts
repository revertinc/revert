import { describe, expect, it } from '@jest/globals';
import { TP_ID } from '@prisma/client';
import { AtsStandardObjects } from '../../../constants/common';
import { atsFields } from '../../../prisma/fields';
import { postprocessDisUnifyAtsObject, preprocessUnifyObject } from './preprocess';

const workableTpId = TP_ID.workable as any;

describe('Workable ATS preprocess (unify)', () => {
    it('shapes candidate email, phone, address and social profiles into unified arrays', () => {
        const candidate = {
            id: 123,
            firstname: 'Ada',
            lastname: 'Lovelace',
            email: 'ada@example.com',
            phone: '+1 555 0100',
            address: '12 Analytical Way, London',
            social_profiles: [
                { type: 'linkedin', name: 'Ada Lovelace', url: 'https://www.linkedin.com/in/ada' },
                { type: 'github', name: 'ada', url: 'https://github.com/ada' },
            ],
            tags: ['engineer'],
        };

        const processed: any = preprocessUnifyObject({
            obj: candidate,
            tpId: workableTpId,
            objType: AtsStandardObjects.candidate,
        });

        expect(processed.email).toEqual([{ value: 'ada@example.com', type: undefined }]);
        expect(processed.phone).toEqual([{ value: '+1 555 0100', type: undefined }]);
        expect(processed.address).toEqual([{ value: '12 Analytical Way, London', type: undefined }]);
        expect(processed.social_profiles).toEqual([
            { value: 'https://www.linkedin.com/in/ada', type: 'linkedin' },
            { value: 'https://github.com/ada', type: 'github' },
        ]);
        // untouched fields pass through
        expect(processed.firstname).toBe('Ada');
        expect(processed.tags).toEqual(['engineer']);
    });

    it('produces empty arrays when a candidate has no contact details', () => {
        const processed: any = preprocessUnifyObject({
            obj: { id: 124, firstname: 'Grace', lastname: 'Hopper' },
            tpId: workableTpId,
            objType: AtsStandardObjects.candidate,
        });

        expect(processed.email).toEqual([]);
        expect(processed.phone).toEqual([]);
        expect(processed.address).toEqual([]);
        expect(processed.social_profiles).toEqual([]);
    });

    it('maps Workable job states to unified job statuses', () => {
        const stateOf = (state: string) =>
            preprocessUnifyObject({
                obj: { shortcode: 'ABC123', title: 'Engineer', state, department: 'Engineering' },
                tpId: workableTpId,
                objType: AtsStandardObjects.job,
            }) as any;

        expect(stateOf('published').state).toBe('open');
        expect(stateOf('closed').state).toBe('closed');
        expect(stateOf('archived').state).toBe('closed');
        expect(stateOf('draft').state).toBe('draft');
    });

    it('wraps the Workable job department name into a department list', () => {
        const processed: any = preprocessUnifyObject({
            obj: { shortcode: 'ABC123', title: 'Engineer', state: 'published', department: 'Engineering' },
            tpId: workableTpId,
            objType: AtsStandardObjects.job,
        });

        expect(processed.department).toEqual([{ name: 'Engineering' }]);
    });

    it('leaves offers and departments untouched on unify', () => {
        const offer = { id: 1, candidate_id: 2, status: 'draft' };
        expect(preprocessUnifyObject({ obj: offer, tpId: workableTpId, objType: AtsStandardObjects.offer })).toEqual(
            offer,
        );
    });
});

describe('Workable ATS postprocess (disunify)', () => {
    it('is registered for the workable tp id and returns the object unchanged', () => {
        const obj = { name: 'Engineering' };
        expect(
            postprocessDisUnifyAtsObject({ obj, tpId: TP_ID.workable, objType: AtsStandardObjects.department }),
        ).toEqual(obj);
    });
});

describe('Workable ATS field mappings', () => {
    it('defines a workable source field for every unified ATS field', () => {
        for (const objType of Object.values(AtsStandardObjects)) {
            const entries = (atsFields as any)[objType] as any[];
            expect(entries.length).toBeGreaterThan(0);
            for (const entry of entries) {
                expect(entry.source_field_name).toHaveProperty(TP_ID.workable);
            }
        }
    });

    it('maps the core candidate, job, offer and department fields to Workable API fields', () => {
        const sourceOf = (objType: AtsStandardObjects, target: string) =>
            (atsFields as any)[objType].find((e: any) => e.target_field_name === target)?.source_field_name[
                TP_ID.workable
            ];

        expect(sourceOf(AtsStandardObjects.candidate, 'id')).toBe('id');
        expect(sourceOf(AtsStandardObjects.candidate, 'first_name')).toBe('firstname');
        expect(sourceOf(AtsStandardObjects.candidate, 'last_name')).toBe('lastname');
        expect(sourceOf(AtsStandardObjects.candidate, 'email_addresses')).toBe('email');
        expect(sourceOf(AtsStandardObjects.candidate, 'phone_numbers')).toBe('phone');
        expect(sourceOf(AtsStandardObjects.candidate, 'photo_url')).toBe('image_url');

        // Workable jobs are addressed by shortcode, so the unified job id is the shortcode.
        expect(sourceOf(AtsStandardObjects.job, 'id')).toBe('shortcode');
        expect(sourceOf(AtsStandardObjects.job, 'name')).toBe('title');
        expect(sourceOf(AtsStandardObjects.job, 'requisition_id')).toBe('code');
        expect(sourceOf(AtsStandardObjects.job, 'status')).toBe('state');

        expect(sourceOf(AtsStandardObjects.offer, 'candidate_id')).toBe('candidate_id');
        expect(sourceOf(AtsStandardObjects.department, 'name')).toBe('name');
    });
});
