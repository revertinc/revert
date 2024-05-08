import { Request } from 'express';

const skipRateLimitRoutes = (req: Request) => {
    const nonSecurePaths = ['/oauth-callback', '/oauth/refresh'];
    const nonSecurePathsPartialMatch = ['/integration-status', '/trello-request-token'];
    const allowedRoutes = ['/health-check'];
    if (
        nonSecurePaths.includes(req.path) ||
        nonSecurePathsPartialMatch.some((path) => req.path.includes(path)) ||
        allowedRoutes.includes(req.baseUrl + req.path)
    ) {
        return true;
    }
    return false;
};

export { skipRateLimitRoutes };
