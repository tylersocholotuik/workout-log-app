import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";

interface DeleteWorkoutModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    callbackFunction: () => void;
}

export default function DeleteWorkoutModal({
    isOpen,
    onOpenChange,
    callbackFunction,
}: DeleteWorkoutModalProps) {
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
                            Delete Workout
                        </ModalHeader>
                        <ModalBody>
                            <p className="">
                                Are you sure you want to delete this workout?
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
                                    callbackFunction();
                                    onClose();
                                }}
                            >
                                Delete
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
