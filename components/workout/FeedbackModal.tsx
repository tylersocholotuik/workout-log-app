import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";

import { Dispatch, SetStateAction } from "react";

interface FeedbackModalProps {
    isOpen: boolean,
    onOpenChange: () => void,
    title: string,
    message: string,
    color: string,
    setFeedback: Dispatch<SetStateAction<string>> | undefined,
    setError: Dispatch<SetStateAction<string>> | undefined
}

export default function FeedbackModal({
    isOpen,
    onOpenChange,
    title,
    message,
    color,
    setFeedback,
    setError,
}: FeedbackModalProps) {

    const resetMessage = () => {
        if (setFeedback !== undefined) setFeedback("");
        if (setError !== undefined) setError("");
    }

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            classNames={{
                header: `text-${color}`
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            {title}
                        </ModalHeader>
                        <ModalBody>
                            <p>{message}</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={() => {
                                    resetMessage();
                                    onClose();
                                }}
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
