'use client';

import { useConnection } from '@revertdotdev/hooks';

export default function Page({ params }: { params: { integrationId: string } }) {
    const { integrationId } = params;
    const { data, error, isLoading } = useConnection(integrationId);

    if (data) {
        window.close();
    }

    return (
        <div>
            <h1>OAuthCallback: data: error:</h1>
            <p>Loading Status: {isLoading}</p>
        </div>
    );
}
