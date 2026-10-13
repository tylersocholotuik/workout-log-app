import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { useState } from "react";

type ButtonColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined;

interface ConfirmationModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    headerText: string;
    bodyText: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: ButtonColor;
    cancelButtonColor?: ButtonColor;
    confirmFunction: () => void | Promise<void>;
    cancelFunction?: () => void | Promise<void>;
}

export default function ConfirmationModal({
                                              isOpen,
                                              onOpenChange,
                                              confirmFunction,
                                              headerText,
                                              bodyText,
                                              confirmButtonText,
                                              confirmButtonColor,
                                              cancelButtonText,
                                              cancelButtonColor,
                                              cancelFunction,
                                          }: ConfirmationModalProps) {
    const [isConfirming, setIsConfirming] = useState(false);

    return (
        <Modal
            isOpen={isOpen}
            placement="center"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                {(onClose) => {
                    const handleConfirm = async () => {
                        setIsConfirming(true);
                        try {
                            await confirmFunction();
                            onClose();
                        } catch {
                            // No-op catch - the caller/global error handler is
                            // responsible for surfacing the error. Leave the modal
                            // open so the user can see the failure and retry.
                        } finally {
                            setIsConfirming(false);
                        }
                    };

                    return (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-md">
                                {headerText}
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm">
                                    {bodyText}
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color={cancelButtonColor || "default"}
                                    variant="flat"
                                    size="sm"
                                    isDisabled={isConfirming}
                                    onPress={() => {
                                        void (cancelFunction ? cancelFunction() : undefined);
                                        onClose();
                                    }}
                                >
                                    {cancelButtonText || "Cancel"}
                                </Button>
                                <Button
                                    color={confirmButtonColor || "primary"}
                                    variant="solid"
                                    size="sm"
                                    isLoading={isConfirming}
                                    onPress={() => {
                                        void handleConfirm();
                                    }}
                                >
                                    {confirmButtonText || "Confirm"}
                                </Button>
                            </ModalFooter>
                        </>
                    );
                }}
            </ModalContent>
        </Modal>
    );
}
