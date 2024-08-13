import { auth } from '@clerk/nextjs/server';
import {
    Button,
    Header,
    Modal,
    ModalContent,
    ModalDescription,
    ModalHeader,
    ModalTitle,
    ModalTrigger,
} from '@revertdotdev/components';
import { CreatedApplications, ApplicationCards } from '@revertdotdev/components';
import { Icons } from '@revertdotdev/icons';
import { fetchAccountDetails } from '@revertdotdev/lib/api';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Revert | Integrations',
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

    const { apps, isDefaultEnvironment } = account;
    return (
        <main>
            <Modal>
                <Header title="Integrations" description="Configure and Manage your connected apps here">
                    <ModalTrigger asChild>
                        <Button tabIndex={0}>
                            <div className="flex gap-2 justify-center items-center">
                                <Icons.plus />
                                Create Integration
                            </div>
                        </Button>
                    </ModalTrigger>
                    <ModalContent>
                        <ModalHeader className="mb-8">
                            <ModalTitle>Let&apos;s ship an integration in under 60 minutes</ModalTitle>
                            <ModalDescription>
                                Add a pre-built UI to your frontend with options to select an integration with zero
                                custom code
                            </ModalDescription>
                        </ModalHeader>
                        <ApplicationCards
                            apps={apps}
                            userId={userId}
                            environment={isDefaultEnvironment ? 'development' : 'production'}
                        />
                    </ModalContent>
                </Header>
                <CreatedApplications apps={apps} />
            </Modal>
        </main>
    );
}
