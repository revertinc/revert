import createConnectionPool, { sql } from '@databases/pg';
import axios from 'axios';
import express from 'express';
import crmRouter from './crm';
import metadataRouter from './metadata';
import config from '../config';

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

router.post('/slack-alert', async (req, res) => {
    const db = createConnectionPool(config.PGSQL_URL);
    try {
        const email = req.body.email;
        await axios({
            method: 'post',
            url: `https://hooks.slack.com/services/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`,
            data: JSON.stringify({ text: `Woot! :zap: ${email} signed up for Revert!` }),
        });
        await db.query(sql`
            INSERT INTO waitlist (
               email
            ) VALUES (${email})
            ON CONFLICT DO NOTHING
        `);
        res.send({
            status: 'ok',
        });
    } catch (error) {
        res.send({
            status: 'error',
            error: error,
        });
    } finally {
        await db.dispose();
    }
});

export default router;
export { crmRouter, metadataRouter };
