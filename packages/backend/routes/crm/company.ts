import express from 'express';
import customerMiddleware from '../../helpers/customerIdMiddleware';
import tenantMiddleware from '../../helpers/tenantIdMiddleware';
import CompanyService from '../../services/company';

const companyRouter = express.Router({ mergeParams: true });

/**
 * Company API
 */

// Get all companies (paginated)
companyRouter.get('/', customerMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.getUnifiedCompanies(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch companies', error);
        res.status(500).send({ error: 'Unexpected error. Could not fetch companies' });
    }
});

// Get a company object identified by {id}
companyRouter.get('/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.getUnifiedCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch company', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a company
companyRouter.post('/', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.createCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create company', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Update a company identified by {id}
companyRouter.patch('/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.updateCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update company', error.response);
        res.status(500).send({
            error: 'Internal server error',
            errorResponse: error.response?.data,
        });
    }
});

// Search a company with query.
companyRouter.post('/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.searchUnifiedCompanies(req, res);
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

export default companyRouter;
