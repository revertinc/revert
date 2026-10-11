import { disunifyAtsObject } from './disunify';
import { AtsStandardObjects } from '../../../constants/common';
import { TP_ID } from '@prisma/client';

jest.mock('../../logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

jest.mock('./transformSchemaMapping', () => ({
    transformModelToFieldMapping: jest.fn().mockImplementation(async ({ unifiedObj }) => unifiedObj || {}),
    transformFieldMappingToModel: jest.fn().mockImplementation(async ({ obj }) => obj || {}),
}));

describe('disunifyAtsObject (workable)', () => {
    it('builds the Workable candidate payload with firstname/lastname/email', async () => {
        const out: any = await disunifyAtsObject({
            obj: {
                first_name: 'Jane',
                last_name: 'Doe',
                email_addresses: [{ value: 'jane@doe.com', type: undefined }],
                phone_numbers: [{ value: '555-0100', type: undefined }],
                addresses: [{ value: '1 Main St', type: undefined }],
                title: 'Ops Manager',
                tags: ['vip'],
            },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });

        expect(out.candidate).toEqual({
            name: 'Jane Doe',
            firstname: 'Jane',
            lastname: 'Doe',
            email: 'jane@doe.com',
            phone: '555-0100',
            address: '1 Main St',
            headline: 'Ops Manager',
            summary: undefined,
            tags: ['vip'],
        });
        // the job shortcode never goes in the body (it goes in the URL)
        expect(JSON.stringify(out)).not.toContain('shortcode');
    });

    it('derives name from first+last when name is absent', async () => {
        const out: any = await disunifyAtsObject({
            obj: { first_name: 'Ada', last_name: 'Lovelace' },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(out.candidate.name).toBe('Ada Lovelace');
        expect(out.candidate.firstname).toBe('Ada');
        expect(out.candidate.lastname).toBe('Lovelace');
    });

    it('keeps a provided full name intact (including middle names)', async () => {
        const out: any = await disunifyAtsObject({
            obj: { first_name: 'Jane', last_name: 'Maria Doe' },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(out.candidate.name).toBe('Jane Maria Doe');
    });
});
