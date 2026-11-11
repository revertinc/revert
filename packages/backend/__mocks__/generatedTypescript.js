class BaseService {
    constructor(impl) {
        Object.assign(this, impl);
    }
}
class UnAuthorizedError extends Error {
    constructor(err) {
        super(err?.error || 'Unauthorized');
    }
}
class NotFoundError extends Error {
    constructor(err) {
        super(err?.error || 'NotFound');
    }
}
class InternalServerError extends Error {
    constructor(err) {
        super(err?.error || 'InternalServerError');
    }
}

module.exports = {
    ConnectionService: BaseService,
    CandidateService: BaseService,
    JobService: BaseService,
    UnAuthorizedError,
    NotFoundError,
    InternalServerError,
    register: () => {},
};
