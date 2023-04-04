import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import LeadService from '../../services/lead';

const noteRouter = express.Router({ mergeParams: true });

/**
 * Notess API
 */

// Get all notes (paginated)
noteRouter.get('/', customerMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.getUnifiedLeads(req, res);
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
noteRouter.get('/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.getUnifiedLead(req, res);
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
noteRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.createLead(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Update a note identified by {id}
noteRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.updateLead(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Search a note with query.
noteRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.searchUnifiedLeads(req, res);
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

export default noteRouter;
