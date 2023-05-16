import express from 'express';

import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import ContactService from '../../services/contact';

const contactRouter = express.Router({ mergeParams: true });

/**
 * Contacts API
 */
// Get all contacts (paginated)
contactRouter.get('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.getUnifiedContacts(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch contacts', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Get a contact object identified by {id}
contactRouter.get('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.getUnifiedContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch contact', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a contact
contactRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.createContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create contact', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Update a contact identified by {id}
contactRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.updateContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update contact', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Search a contact with query.
contactRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.searchUnifiedContacts(req, res);
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

export default contactRouter;
