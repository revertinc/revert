import { cookies } from 'next/headers';
import { DEFAULT_ENV } from './constants';
import { accountResponseSchema, accountSchema } from '@revertdotdev/types/schemas/accountSchema';
import { ZodError } from 'zod';
import { environmentConfig } from './config';

const { REVERT_BASE_API_URL } = environmentConfig;

// Todo: Add Generalised Error Handler
export async function fetchAccountDetails(userId: string) {
    try {
        const response = await fetch(`${REVERT_BASE_API_URL}/internal/account`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const environment = cookies().get('revert_environment_selected')?.value ?? DEFAULT_ENV;
        const jsonResponse = await response.json();
        const { success, data, error } = accountSchema.safeParse(jsonResponse);

        if (!success) {
            throw new ZodError(error.errors);
        }

        const { environments, workspaceName } = data.account;

        const {
            private_token: currentPrivateToken,
            public_token: currentPublicToken,
            apps,
        } = environments.filter((e) => e.env.includes(environment))[0];

        const { private_token: prodPrivateToken } = environments.filter((e) => e.env.includes('production'))[0];

        const isDefaultEnvironment = environment.includes(DEFAULT_ENV);

        const parsedResponse = accountResponseSchema.safeParse({
            apps,
            isDefaultEnvironment,
            currentPrivateToken,
            currentPublicToken,
            prodPrivateToken,
            workspaceName,
        });

        if (!parsedResponse.success) {
            throw new ZodError(parsedResponse.error.errors);
        }

        return parsedResponse.data;
    } catch (err) {
        return {
            name: 'Something went wrong',
            message: err,
        };
    }
}
