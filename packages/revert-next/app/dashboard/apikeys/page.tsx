import { auth } from '@clerk/nextjs/server';
import { Clipboard, Header } from '@revertdotdev/components';
import { fetchAccountDetails } from '@revertdotdev/lib/api';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Revert | API Keys',
};

export default async function Page() {
    const { userId } = auth();

    if (!userId) {
        return null;
    }

    const account = await fetchAccountDetails(userId);

    if ('message' in account) {
        return null;
    }

    const { currentPrivateToken, currentPublicToken } = account;

    return (
        <main>
            <Header title="API Keys" description="Manage your Revert API Keys here." />
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-1">Publishable key</h2>
                <p className="text-sm text-gray-50/70 mb-2">
                    This key should be used in your frontend code, can be safely shared and does not need to be kept
                    secret
                </p>
                <Clipboard value={currentPublicToken} />
            </div>
            <div>
                <h2 className="text-lg font-semibold mb-1">Secret key</h2>
                <p className="text-sm text-gray-50/70 mb-2">
                    This are the secret keys to be used from your backend code.They are sensitive and should be deleted
                    if leaked
                </p>
                <Clipboard value={currentPrivateToken} />
            </div>
        </main>
    );
}
