'use server';

import { cookies } from 'next/headers';
import { DEFAULT_ENV, REVERT_BASE_API_URL } from './constants';
import { revalidatePath } from 'next/cache';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';

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
}

// Todo: handle failure
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
