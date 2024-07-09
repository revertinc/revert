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
import { Icons } from '@revertdotdev/icons';

export default async function Page() {
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
                        <ModalHeader>
                            <ModalTitle>Let&apos;s ship an integration in under 60 minutes</ModalTitle>
                            <ModalDescription>
                                Add a pre-built UI to your frontend with options to select an integration with zero
                                custom code
                            </ModalDescription>
                        </ModalHeader>
                        <ModalFooter>
                            <Button type="submit">
                                <span>Add Integration</span>
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Header>
            </Modal>
        </main>
    );
}
