import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import NoteService from '../../services/note';

const noteRouter = express.Router({ mergeParams: true });

/**
 * Notes API
 */

// Get all notes (paginated)
noteRouter.get('/', customerMiddleware(), async (req, res) => {
    try {
        const result = await NoteService.getUnifiedNotes(req, res);
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
        const result = await NoteService.getUnifiedNote(req, res);
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
        const result = await NoteService.createNote(req, res);
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
noteRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await NoteService.updateNote(req, res);
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
        const result = await NoteService.searchUnifiedNotes(req, res);
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
