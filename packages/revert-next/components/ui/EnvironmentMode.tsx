'use client';

import { changeEnvironmentMode } from '@revertdotdev/lib/actions';
import { Icons } from '../icons';
import { Switch } from './common/Switch';
import { useAnalytics } from '@revertdotdev/hooks/useAnalytics';
import { REVERT_BASE_API_URL } from '@revertdotdev/lib/constants';

function EnvironmentMode({ isDefaultEnvironment, userId }: { isDefaultEnvironment: boolean; userId: string }) {
    const { mutate } = useAnalytics(userId);
    return (
        <>
            <Icons.axe className="w-6 hidden md:block" />
            <label htmlFor="environment">Dev Mode</label>
            <Switch
                id="environment"
                className="md:ml-auto"
                checked={isDefaultEnvironment}
                onClick={async () => {
                    await changeEnvironmentMode();
                    setTimeout(async () => await mutate(`${REVERT_BASE_API_URL}/internal/analytics`), 1000);
                }}
            />
        </>
    );
}

export default EnvironmentMode;
