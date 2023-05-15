import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import LeadService from '../../services/lead';

const leadRouter = express.Router({ mergeParams: true });

/**
 * Leads API
 */

// Get all leads (paginated)
leadRouter.get('/', tenantMiddleware(), async (req, res) => {
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

// Get a lead object identified by {id}
leadRouter.get('/:id', tenantMiddleware(), async (req, res) => {
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

// Create a lead
leadRouter.post('/', tenantMiddleware(), async (req, res) => {
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
            errorResponse: error.response?.data,
        });
    }
});

// Update a lead identified by {id}
leadRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
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
            errorResponse: error.response?.data,
        });
    }
});

// Search a lead with query.
leadRouter.post('/search', tenantMiddleware(), async (req, res) => {
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

export default leadRouter;
