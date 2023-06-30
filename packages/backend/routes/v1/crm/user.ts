import express from 'express';

import tenantMiddleware from '../../../helpers/tenantIdMiddleware';
import UserService from '../../../services/user';
import logError from '../../../helpers/logError';

const userRouter = express.Router({ mergeParams: true });

/**
 * Tasks API
 */

// Get all tasks (paginated)
userRouter.get('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await UserService.getUnifiedUsers(req, res);
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

// Get a task object identified by {id}
userRouter.get('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await UserService.getUnifiedUser(req, res);
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

// Create a task
userRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await UserService.createUser(req, res);
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

export default userRouter;
