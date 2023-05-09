import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import TaskService from '../../services/task';

const taskRouter = express.Router({ mergeParams: true });

/**
 * Tasks API
 */

// Get all tasks (paginated)
taskRouter.get('/', customerMiddleware(), async (req, res) => {
    try {
        const result = await TaskService.getUnifiedTasks(req, res);
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

// Get a task object identified by {id}
taskRouter.get('/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await TaskService.getUnifiedTask(req, res);
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

// Create a task
taskRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await TaskService.createTask(req, res);
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

// Update a task identified by {id}
taskRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await TaskService.updateTask(req, res);
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

// Search a task with query.
taskRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await TaskService.searchUnifiedTasks(req, res);
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

export default taskRouter;
