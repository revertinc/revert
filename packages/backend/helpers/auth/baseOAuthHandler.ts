import { IntegrationAuthProps } from '../../constants/common';
import { Response } from 'express';

abstract class BaseOAuthHandler {
    async handleOAuth(_integrationAuthProps: IntegrationAuthProps): Promise<Response<any, Record<string, any>> | void> {
        return;
    }
}

export default BaseOAuthHandler;
