import express from 'express';

import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import ConnectionService from '../../services/connection';

const connectionRouter = express.Router({ mergeParams: true });

/**
 * Connections API
 */

connectionRouter.get('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ConnectionService.getConnection(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch leads', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

export default connectionRouter;
export { connectionRouter };
