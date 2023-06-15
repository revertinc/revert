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
        console.error('Could not fetch connection', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

connectionRouter.get('/all', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ConnectionService.getAllConnections(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch connections', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

connectionRouter.delete('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ConnectionService.deleteConnection(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not delete connection', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

connectionRouter.post('/webhook', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ConnectionService.createWebhook(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not create webhook', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

connectionRouter.delete('/webhook', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ConnectionService.deleteWebhook(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not delete webhook', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

export default connectionRouter;
export { connectionRouter };
