import fs from 'fs';
import path from 'path';

/**
 * Acceptance gate for revertinc/revert#551 (Algora $100 Workable ATS bounty).
 * These tests fail until Workable is wired like Greenhouse/Lever.
 */
describe('Workable ATS integration (#551)', () => {
    const root = path.join(__dirname, '../..');

    test('prisma TP_ID enum includes workable', () => {
        const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
        expect(schema).toMatch(/^\s*workable\s*$/m);
    });

    test('ATS_TP_ID type union includes workable', () => {
        const common = fs.readFileSync(path.join(root, 'constants/common.ts'), 'utf8');
        expect(common).toMatch(/export type ATS_TP_ID = '[^']*'(\s*\|\s*'[^']*')*;/);
        expect(common).toMatch(/ATS_TP_ID[\s\S]*workable/);
    });

    test('workable auth handler module exists', () => {
        const handler = path.join(root, 'routes/v1/ats/authHandlers/workable.ts');
        expect(fs.existsSync(handler)).toBe(true);
    });

    test('ats auth router switches on TP_ID.workable', () => {
        const auth = fs.readFileSync(path.join(root, 'routes/v1/ats/auth.ts'), 'utf8');
        expect(auth).toMatch(/authHandlers\/workable/);
        expect(auth).toMatch(/case TP_ID\.workable/);
    });

    test('workable helper exports base URL and headers', () => {
        const helper = fs.readFileSync(path.join(root, 'helpers/ats/workable.ts'), 'utf8');
        expect(helper).toMatch(/export function workableBaseUrl/);
        expect(helper).toMatch(/export function workableHeaders/);
        expect(helper).toMatch(/export function workableProxyPath/);
    });

    test('ats services implement workable list/get switches', () => {
        for (const file of ['job.ts', 'candidate.ts', 'department.ts', 'offer.ts', 'proxy.ts']) {
            const src = fs.readFileSync(path.join(root, 'services/ats', file), 'utf8');
            expect(src).toMatch(/case TP_ID\.workable/);
        }
    });

    test('prisma fields map workable ATS sources', () => {
        const fields = fs.readFileSync(path.join(root, 'prisma/fields.ts'), 'utf8');
        const atsSection = fields.slice(fields.indexOf('export const atsFields'), fields.indexOf('export const accountingFields'));
        expect(atsSection).toMatch(/\[TP_ID\.workable\]/);
        expect((atsSection.match(/\[TP_ID\.workable\]/g) || []).length).toBeGreaterThan(20);
    });

    test('DEMO.md exists for Algora claim video', () => {
        const demo = path.join(root, '../../DEMO.md');
        expect(fs.existsSync(demo)).toBe(true);
        const body = fs.readFileSync(demo, 'utf8');
        expect(body).toMatch(/Workable/);
        expect(body).toMatch(/ats\/jobs/);
    });
});
