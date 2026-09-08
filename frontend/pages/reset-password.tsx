import {useState} from "react";

import {
    Button,
    Form,
    Input,
    addToast,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
} from "@heroui/react";

import {resetPassword} from "@/lib/api/auth";

import {useRouter} from "next/router";

import Head from "next/head";

export default function ResetPassword() {

    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const isValidForm = (newPassword: string, confirmPassword: string) => {
        setPasswordError("");
        setConfirmPasswordError("");

        const errors: Record<string, string>[] = [];

        if (newPassword.length === 0) {
            errors.push({field: "newPassword", message: "Password is required."});
        }

        if (newPassword.length < 6) {
            errors.push({field: "newPassword", message: "Password must be at least 6 characters."});
        }

        if (newPassword.length > 100) {
            errors.push({field: "newPassword", message: "Password must be 100 characters or less."});
        }

        if (confirmPassword.length === 0) {
            errors.push({field: "confirmPassword", message: "Please confirm your password."});
        }

        if (newPassword !== confirmPassword) {
            errors.push({field: "confirmPassword", message: "Passwords do not match."});
        }

        if (errors.length > 0) {
            errors.forEach(error => {
                if (error.field === "newPassword") {
                    setPasswordError(error.message);
                } else if (error.field === "confirmPassword") {
                    setConfirmPasswordError(error.message);
                }
            });
            return false;
        }

        return true;
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isValidForm(newPassword, confirmPassword)) {

            try {
                setIsLoading(true);
                
                if (!router.isReady) {
                    return;
                }
                
                if (typeof router.query.token !== "string") {
                    addToast({
                        title: "Invalid or missing password reset token",
                        color: "danger"
                    });
                    
                    return;
                }

                await resetPassword({token: router.query.token as string, newPassword});

                addToast({
                    title: "Password reset successfully",
                    color: "success"
                });

                await router.push("/login");
            } catch (error) {
                addToast({
                    title: (error as Error).message,
                    color: "danger"
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const onCancel = async () => {
        await router.push("/login");
    };

    return (
        <>
            <Head>
                <title>Reset Password</title>
            </Head>
            <div className="container mx-auto px-2 md:px-4 py-6">
                <Card className="max-w-full w-[340px] sm:w-[500px] mx-auto">
                    <CardHeader className="justify-center">
                        <h2 className="text-lg">Reset Password</h2>
                    </CardHeader>
                    <CardBody className="overflow-hidden">
                        <div className="flex flex-col items-center gap-6">
                            <Form
                                id="reset-password-form"
                                onSubmit={onSubmit}
                                className="w-full"
                                validationBehavior="aria"
                            >
                                <div className="flex flex-col gap-4 w-full">
                                    <Input
                                        isRequired
                                        label="New Password"
                                        placeholder="Enter your new password"
                                        type="password"
                                        variant="bordered"
                                        validate={() => {
                                            if (passwordError !== "") {
                                                return passwordError;
                                            }
                                        }}
                                        name="newPassword"
                                        value={newPassword}
                                        onValueChange={setNewPassword}
                                        onChange={() => {
                                            setPasswordError("");
                                        }}
                                    />
                                    <Input
                                        isRequired
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        placeholder="Confirm your new password"
                                        type="password"
                                        variant="bordered"
                                        validate={() => {
                                            if (confirmPasswordError !== "") {
                                                return confirmPasswordError;
                                            }
                                        }}
                                        value={confirmPassword}
                                        onValueChange={setConfirmPassword}
                                        onChange={() => {
                                            setConfirmPasswordError("");
                                            setPasswordError("");
                                        }}
                                    />
                                </div>
                            </Form>
                            <CardFooter className="justify-end gap-2">
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
                                    form="reset-password-form"
                                    isLoading={isLoading}
                                >
                                    Reset Password
                                </Button>
                            </CardFooter>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}