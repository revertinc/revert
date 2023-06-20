import express from 'express';
import tenantMiddleware from '../../../helpers/tenantIdMiddleware';
import ProxyService from '../../../services/proxy';

const proxyRouter = express.Router({ mergeParams: true });

/**
 * Proxy API
 */

proxyRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ProxyService.tunnel(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not execute proxy api', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

export default proxyRouter;
