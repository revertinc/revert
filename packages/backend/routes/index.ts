import express from 'express';
import crmRouter from './crm';
import metadataRouter from './metadata';

const router = express.Router();

router.get('/health-check', (_, response) => {
    response.send({
        status: 'ok',
    });
});

router.get('/', (_, response) => {
    response.send({
        status: 'nothing to see here.',
    });
});

export default router;
export { crmRouter, metadataRouter };
