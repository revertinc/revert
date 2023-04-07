import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import UserService from '../../services/user';

const userRouter = express.Router({ mergeParams: true });

/**
 * Tasks API
 */

// Get all tasks (paginated)
userRouter.get('/', customerMiddleware(), async (req, res) => {
    try {
        const result = await UserService.getUnifiedUsers(req, res);
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
userRouter.get('/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await UserService.getUnifiedUser(req, res);
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
userRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await UserService.createUser(req, res);
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

export default userRouter;
