import { cookies } from 'next/headers';
import { REVERT_BASE_API_URL, DEFAULT_ENV } from './constants';
// Todo: Add Generalised Error Handler
export async function fetchAccountDetails(userId: string) {
    try {
        const data = await fetch(`${REVERT_BASE_API_URL}/internal/account`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const environment = cookies().get('revert_environment_selected')?.value ?? DEFAULT_ENV;
        const account = await data.json();
        const { private_token: currentPrivateToken, public_token: currentPublicToken } =
            account.account.environments.filter((e) => e.env.includes(environment))[0];

        const isDefaultEnvironment = environment.includes(DEFAULT_ENV);

        return {
            account,
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
