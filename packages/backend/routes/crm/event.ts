import express from 'express';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import EventService from '../../services/event';

const eventRouter = express.Router({ mergeParams: true });

/**
 * Notes API
 */

// Get all notes (paginated)
eventRouter.get('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await EventService.getUnifiedEvents(req, res);
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

// Get a note object identified by {id}
eventRouter.get('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await EventService.getUnifiedEvent(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch lead', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a note
eventRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await EventService.createEvent(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Update a note identified by {id}
eventRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await EventService.updateEvent(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Search a note with query.
eventRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await EventService.searchUnifiedEvents(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not search CRM', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

export default eventRouter;
