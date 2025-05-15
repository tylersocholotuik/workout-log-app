import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";

interface LoginModalProps {
    isOpen: boolean,
    onOpenChange: () => void,
    displayName: string
}

export default function LoginModal({
    isOpen,
    onOpenChange,
    displayName
}: LoginModalProps) {

    return (
        <Modal
            isOpen={isOpen}
            placement="center"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Welcome!
                        </ModalHeader>
                        <ModalBody>
                            <p>Logged in as {displayName}</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={onClose}
                            >
                                Ok
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
