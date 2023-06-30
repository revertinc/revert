import express from 'express';

import tenantMiddleware from '../../../helpers/tenantIdMiddleware';
import DealService from '../../../services/deal';
import logError from '../../../helpers/logError';

const dealRouter = express.Router({ mergeParams: true });

/**
 * Deals API
 */

// Get all deals (paginated)
dealRouter.get('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await DealService.getUnifiedDeals(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not fetch leads', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Get a deal object identified by {id}
dealRouter.get('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await DealService.getUnifiedDeal(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not fetch lead', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a deal
dealRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await DealService.createDeal(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not create lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Update a deal identified by {id}
dealRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await DealService.updateDeal(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not update lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Search a deal with query.
dealRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await DealService.searchUnifiedDeals(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not search CRM', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

export default dealRouter;
