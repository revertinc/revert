import express from 'express';
// import config from '../../../config';
// // import axios from 'axios';
// import prisma, { Prisma, xprisma } from '../../../prisma/client';
// import logError from '../../../helpers/logger';
// import { TP_ID } from '@prisma/client';

const authRouter = express.Router();

authRouter.get('/discord', async (req, res) => {
   
    res.send("hello")
});


export default authRouter;