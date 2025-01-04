import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";

interface LogoutModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    logOutFunction: () => void;
}

export default function LogoutModal({
    isOpen,
    onOpenChange,
    logOutFunction
}: LogoutModalProps) {
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
                            Logout
                        </ModalHeader>
                        <ModalBody>
                            <p className="">
                                Are you sure you want to logout?
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="default"
                                variant="flat"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                variant="solid"
                                onPress={() => {
                                    logOutFunction();
                                    onClose();
                                }}
                            >
                                Logout
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
