import { auth } from '@clerk/nextjs/server';
import {
    Button,
    Header,
    Modal,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    ModalTrigger,
} from '@revertdotdev/components';
import { CreatedApplications, ApplicationCards } from '@revertdotdev/components';
import { Icons } from '@revertdotdev/icons';
import { fetchAccountDetails } from '@revertdotdev/lib/api';

export default async function Page() {
    const { userId } = auth();

    if (!userId) {
        return null;
    }

    const account = await fetchAccountDetails(userId);

    if ('message' in account) {
        return null;
    }

    const { apps } = account;
    return (
        <main>
            <Modal>
                <Header title="Integrations" description="Configure and Manage your connected apps here">
                    <ModalTrigger asChild>
                        <Button>
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
                        <ApplicationCards apps={apps} />
                        <ModalFooter>
                            <Button type="submit">
                                <span>Add Integration</span>
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Header>
                <CreatedApplications apps={apps} />
            </Modal>
        </main>
    );
}
