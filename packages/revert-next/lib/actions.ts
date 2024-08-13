'use server';
import { cookies } from 'next/headers';
import { DEFAULT_ENV } from './constants';
import { revalidatePath } from 'next/cache';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';
import { AppConfig } from '@revertdotdev/types/schemas/appSchema';
import { environmentConfig } from './config';

const { REVERT_BASE_API_URL } = environmentConfig;

export async function changeEnvironmentMode() {
    const cookie = cookies();
    const currentMode = cookie.get('revert_environment_selected')?.value ?? DEFAULT_ENV;

    if (currentMode.includes(DEFAULT_ENV)) {
        cookie.set('revert_environment_selected', 'production');
    } else {
        cookie.set('revert_environment_selected', 'development');
    }

    // todo: revalidate every path later
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/onboarding');
}

export async function setOnboardingCompleted({ userId, environment }: { userId: string; environment: string }) {
    const response = await fetch(`${REVERT_BASE_API_URL}/internal/account/onboarding`, {
        method: 'POST',
        body: JSON.stringify({
            userId,
            environment,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    revalidatePath('/dashboard/onboarding');
    return data;
}

export async function createApplication({
    userId,
    tpId,
    environment,
}: {
    userId: string;
    tpId: tp_id;
    environment: string;
}) {
    const response = await fetch(`${REVERT_BASE_API_URL}/internal/account/apps`, {
        method: 'POST',
        body: JSON.stringify({
            userId,
            tpId,
            environment,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    revalidatePath('/dashboard/integrations');
    return data;
}

export async function updateCredentials({
    clientId,
    clientSecret,
    scopes,
    tpId,
    isRevertApp,
    appId,
    appConfig,
    privateToken,
}: {
    clientId: string;
    clientSecret: string;
    scopes: Array<string>;
    tpId: tp_id;
    isRevertApp: boolean;
    appId: string;
    appConfig?: AppConfig;
    privateToken: string;
}) {
    // Todo: handle errors;
    try {
        const response = await fetch(`${REVERT_BASE_API_URL}/internal/account/credentials`, {
            method: 'POST',
            body: JSON.stringify({
                clientId,
                clientSecret,
                scopes,
                tpId,
                isRevertApp,
                appConfig,
                appId,
            }),
            headers: {
                'Content-type': 'application/json',
                'x-revert-api-token': privateToken,
            },
        });

        const data = await response.json();
        revalidatePath(`/dashboard/integrations/config/settings/${appId}`);
        return data;
    } catch (err) {
        return {
            name: 'Something went wrong',
            message: JSON.stringify(err),
        };
    }
}

export async function deleteIntegration({ appId, privateToken }: { appId: string; privateToken: string }) {
    try {
        const response = await fetch(`${REVERT_BASE_API_URL}/internal/account/apps`, {
            method: 'DELETE',
            body: JSON.stringify({
                appId,
            }),
            headers: {
                'Content-type': 'application/json',
                'x-revert-api-token': privateToken,
            },
        });

        await response.json();
        revalidatePath('/dashboard/integrations');
    } catch (err) {
        return {
            name: 'Something went wrong',
            message: JSON.stringify(err),
        };
    }
}
