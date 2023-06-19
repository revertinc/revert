import { Request, Response, NextFunction } from 'express';

type API_VERSIONS = 'v1' | 'v2' | 'latest';

const DEFAULT_API_VERSION: API_VERSIONS = "v1"

declare global {
    namespace Express {
        interface Request {
            version: API_VERSIONS;
        }
    }
}

const versionMiddleware = () => async (req: Request, _res: Response, next: () => any) => {
    const version = req.headers['x-api-version'] as API_VERSIONS || DEFAULT_API_VERSION;
    req.version = version;
    next();
};

// TODO: Give proper types, handle expections, should call default function?
export const manageRouterVersioning = (versionMap: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { version } = req;
        const fn = versionMap[version] || versionMap[DEFAULT_API_VERSION]; // call the v1 functions as default
        fn.call(this, req, res, next);
    };
};

export default versionMiddleware;
