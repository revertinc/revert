import { getWorkableBaseUrl, getWorkableCollection, getWorkableNextCursor, getWorkableResource } from './workable';

const mockConnection = (configuredUrl?: string) =>
    ({
        tp_access_token: 'token',
        tp_account_url: configuredUrl,
        app: {
            app_config: {
                org_url: configuredUrl,
            },
        },
    }) as any;

describe('Workable ATS helper', () => {
    describe('getWorkableBaseUrl', () => {
        it('builds the SPI URL from a bare subdomain', () => {
            expect(getWorkableBaseUrl(mockConnection('acme'))).toBe('https://acme.workable.com/spi/v3');
        });

        it('normalizes configured host URLs', () => {
            expect(getWorkableBaseUrl(mockConnection('https://acme.workable.com/'))).toBe(
                'https://acme.workable.com/spi/v3',
            );
        });

        it('does not duplicate the SPI path', () => {
            expect(getWorkableBaseUrl(mockConnection('https://acme.workable.com/spi/v3'))).toBe(
                'https://acme.workable.com/spi/v3',
            );
        });
    });

    it('extracts collection responses from common Workable response shapes', () => {
        expect(getWorkableCollection({ candidates: [{ id: 'candidate-1' }] }, 'candidates')).toEqual([
            { id: 'candidate-1' },
        ]);
        expect(getWorkableCollection({ data: [{ id: 'candidate-2' }] }, 'candidates')).toEqual([{ id: 'candidate-2' }]);
    });

    it('extracts resource responses from wrapped and unwrapped payloads', () => {
        expect(getWorkableResource({ candidate: { id: 'candidate-1' } }, 'candidate')).toEqual({
            id: 'candidate-1',
        });
        expect(getWorkableResource({ id: 'candidate-2' }, 'candidate')).toEqual({ id: 'candidate-2' });
    });

    it('extracts supported next cursor fields', () => {
        expect(getWorkableNextCursor({ paging: { next: 'next-id' } })).toBe('next-id');
        expect(getWorkableNextCursor({ paging: { next_id: 'next-id' } })).toBe('next-id');
        expect(getWorkableNextCursor({ next: 'next-id' })).toBe('next-id');
        expect(getWorkableNextCursor({})).toBeUndefined();
    });
});
