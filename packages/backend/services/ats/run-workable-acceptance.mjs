import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.join(root, '../..');
let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else { console.log('FAIL', name); failed++; }
}
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
check('prisma TP_ID includes workable', /^\s*workable\s*$/m.test(schema));
const common = fs.readFileSync(path.join(root, 'constants/common.ts'), 'utf8');
check('ATS_TP_ID includes workable', /ATS_TP_ID[\s\S]*workable/.test(common));
check('workable auth handler exists', fs.existsSync(path.join(root, 'routes/v1/ats/authHandlers/workable.ts')));
const auth = fs.readFileSync(path.join(root, 'routes/v1/ats/auth.ts'), 'utf8');
check('auth imports workable handler', /authHandlers\/workable/.test(auth));
check('auth switches TP_ID.workable', /case TP_ID\.workable/.test(auth));
const helper = fs.readFileSync(path.join(root, 'helpers/ats/workable.ts'), 'utf8');
check('helper workableBaseUrl', /export function workableBaseUrl/.test(helper));
check('helper workableProxyPath', /export function workableProxyPath/.test(helper));
for (const file of ['job.ts', 'candidate.ts', 'department.ts', 'offer.ts', 'proxy.ts']) {
  const src = fs.readFileSync(path.join(root, 'services/ats', file), 'utf8');
  check(`${file} has TP_ID.workable`, /case TP_ID\.workable/.test(src));
}
const fields = fs.readFileSync(path.join(root, 'prisma/fields.ts'), 'utf8');
const ats = fields.slice(fields.indexOf('export const atsFields'), fields.indexOf('export const accountingFields'));
check('fields.ts has workable ATS mappings', (ats.match(/\[TP_ID\.workable\]/g) || []).length > 20);
check('DEMO.md present', fs.existsSync(path.join(repoRoot, 'DEMO.md')));
check('seed allows workable', /tpId === 'workable'/.test(fs.readFileSync(path.join(root, 'prisma/seed.ts'), 'utf8')));
process.exit(failed ? 1 : 0);
