import { cookies } from 'next/headers';
import { REVERT_BASE_API_URL, DEFAULT_ENV } from './constants';

// Todo: Add Generalised Error Handler and Add Zod Later
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

        // const { success, data, error } = accountSchema.safeParse(jsonResponse);

        // if (!success) {
        //     throw new ZodError(error.errors);
        // }

        // const { environments } = data.account;

        const { private_token: currentPrivateToken, public_token: currentPublicToken } =
            jsonResponse?.account?.environments.filter((e) => e.env.includes(environment))[0];

        const isDefaultEnvironment = environment.includes(DEFAULT_ENV);

        // const parsedResponse = accountResponseSchema.safeParse({
        //     isDefaultEnvironment,
        //     currentPrivateToken,
        //     currentPublicToken,
        // });

        // if (!parsedResponse.success) {
        //     throw new ZodError(parsedResponse.error.errors);
        // }

        return {
            isDefaultEnvironment,
            currentPrivateToken,
            currentPublicToken,
        };
    } catch (err) {
        return {
            name: 'Something went wrong',
            message: err,
        };
    }
}
