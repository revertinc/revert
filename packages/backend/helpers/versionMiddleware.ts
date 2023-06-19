import { Request, Response, NextFunction } from 'express';

type APP_VERSIONS = 'v1' | 'v2' | 'latest';

declare global {
    namespace Express {
        interface Request {
            version: APP_VERSIONS;
        }
    }
}

const versionMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const version = req.headers['x-api-version'] as APP_VERSIONS;

    if (version) {
        req.version = version;
        next();
    } else {
        res.status(400).send({ error: 'API version is missing' });
    }
};

// TODO: Give proper types, handle expections, should call default function?
export const manageRouterVersioning = (versionMap: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { version } = req;
        const fn = versionMap[version];
        fn.call(this, req, res, next);
    };
};

export default versionMiddleware;
