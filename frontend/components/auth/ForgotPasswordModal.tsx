import { useState } from "react";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Form,
    Input, 
    addToast,
} from "@heroui/react";

import { sendPasswordResetEmail } from "@/lib/api/auth";

interface ForgotPasswordModalProps {
    isOpen: boolean,
    onOpenChange: () => void
}

export default function ForgotPasswordModal({ isOpen, onOpenChange }: ForgotPasswordModalProps) {

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const isValidEmail = (email: string) => {
        setEmailError("");

        if (email.length === 0) {
            setEmailError("Email is required.");
            return false;
        }

        if (email.length > 255) {
            setEmailError("Email must be 255 characters or less.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setEmailError("Invalid email address.");
            return false;
        }

        return true;
    };
    
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValidEmail(email)) {
            try {
                setIsLoading(true);
                
                await sendPasswordResetEmail(email);
                
                setEmailError("");
                setEmail("");
                
                addToast({
                    description: `A password reset link has been sent to ${email}.`,
                    color: "success",
                });
                
                onOpenChange();
            } catch (error) {
                setEmailError((error as Error).message);
                addToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    color: "danger",
                });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const onCancel = () => {
        setEmailError("");
        setEmail("");
        onOpenChange();
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            size="lg"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-lg">Forgot Password</h2>
                        </ModalHeader>
                        <ModalBody>
                            <Form
                                id="forgot-password-form"
                                className="w-full"
                                validationBehavior="aria"
                                onSubmit={onSubmit}
                            >
                            <Input
                                label="Email Address"
                                variant="bordered"
                                isRequired
                                maxLength={255}
                                placeholder={"Enter your email address"}
                                errorMessage={emailError}
                                validate={() => {
                                    if (emailError !== "") {
                                        return emailError;
                                    }
                                }}
                                value={email}
                                onValueChange={setEmail}
                                onChange={() => setEmailError("")}
                            />
                            </Form>
                            <p className="text-sm">
                                An email from <span className="font-bold">Workout Log</span> will be sent to your email address with a link to reset your password. Please check your inbox and spam folder for the email.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="default"
                                variant="flat"
                                onPress={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                variant="solid"
                                type="submit"
                                form="forgot-password-form"
                                isLoading={isLoading}
                            >
                                Send Reset Link
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
