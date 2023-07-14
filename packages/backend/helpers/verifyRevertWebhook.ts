import crypto from 'crypto';
import { Request, ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

const verifyRevertWebhook = (
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    secret: string
) => {
    const payload = req.body;
    const headers = req.headers;
    const signedContent = `${headers['svix-id']}.${headers['svix-timestamp']}.${JSON.stringify(payload)}`;
    const secretBytes = Buffer.from(secret?.split('_')[1], 'base64');
    const signature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    const verified = (headers['svix-signature'] as any)
        .split(' ')
        .map((x: string) => x.split(',')[1])
        .includes(signature);
    return verified;
};

export default verifyRevertWebhook;
