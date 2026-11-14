import {useState, useMemo} from "react";

import {useAuth} from "@/components/auth/AuthProvider";

import {
    Form,
    Input,
    Button,
    addToast,
    Spinner,
    useDisclosure
} from "@heroui/react";

import {useMutation} from "@tanstack/react-query";
import {changePassword} from "@/lib/api/auth";
import {ChangePasswordData} from "@/types";
import {
    runValidators,
    validatePassword,
    validatePasswordsMatch
} from "@/lib/validation/userValidation";

import ConfirmationModal from "@/components/shared/ConfirmationModal";

export default function PasswordChangeForm() {
    const {isLoading, logout} = useAuth();
    const confirmPasswordChangeModal = useDisclosure();

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const [errors, setErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const updatePasswordMutation = useMutation({
        mutationFn: (passwords: ChangePasswordData) => changePassword(passwords),
        onSuccess: () => {
            addToast({
                description: "Your password has been updated.",
                color: "success"
            });
        },
        onError: () => {
            // When the current password is incorrect, an error occurs and the user needs to re-type their password.
            // The modal needs to be closed so that the user can re-enter their current password without manually closing the modal.
            confirmPasswordChangeModal.onClose();   
        }
    });

    const clearFieldError = (field: keyof typeof errors) => {
        setErrors((prev) => ({...prev, [field]: ""}));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationErrors = runValidators(formData, {
            currentPassword: validatePassword,
            newPassword: validatePassword,
            confirmNewPassword: () => validatePasswordsMatch(formData.newPassword, formData.confirmNewPassword)
        });

        setErrors({
            currentPassword: validationErrors.currentPassword ?? "",
            newPassword: validationErrors.newPassword ?? "",
            confirmNewPassword: validationErrors.confirmNewPassword ?? "",
        });

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        confirmPasswordChangeModal.onOpen();
    };
    
    const confirmPasswordChange = async () => {
        await updatePasswordMutation.mutateAsync({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
        });
        
        logout();
    };
    
    const handleCancel = () => {
        setFormData({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: ""
        });
        setErrors({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: ""
        });
    };
    
    const isSaveDisabled = useMemo(() => {
        return (
            !formData.currentPassword ||
            !formData.newPassword ||
            !formData.confirmNewPassword ||
            Object.values(errors).some((error) => error !== "")
        );
    }, [formData, errors]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner size="lg" color="primary"/>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4 max-w-full w-[340px] sm:w-[500px] mx-auto mt-6">
                <h3 className="mb-2">Change Password</h3>
                <Form
                    className="w-full"
                    id="password-change-form"
                    validationBehavior="aria"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-4 w-full">
                        <Input
                            isRequired
                            id="currentPassword"
                            name="currentPassword"
                            label="Current Password"
                            labelPlacement="outside"
                            placeholder="Enter your current password"
                            type="password"
                            validate={() => errors.currentPassword || undefined}
                            value={formData.currentPassword}
                            onChange={(e) => {
                                setFormData({...formData, currentPassword: e.target.value});
                                clearFieldError("currentPassword");
                            }}
                        />
                        <Input
                            isRequired
                            id="newPassword"
                            name="newPassword"
                            label="New Password"
                            labelPlacement="outside"
                            placeholder="Enter your new password"
                            type="password"
                            validate={() => errors.newPassword || undefined}
                            value={formData.newPassword}
                            onChange={(e) => {
                                setFormData({...formData, newPassword: e.target.value});
                                clearFieldError("newPassword");
                            }}
                        />
                        <Input
                            isRequired
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            label="Confirm New Password"
                            labelPlacement="outside"
                            placeholder="Confirm your new password"
                            type="password"
                            validate={() => errors.confirmNewPassword || undefined}
                            value={formData.confirmNewPassword}
                            onChange={(e) => {
                                setFormData({...formData, confirmNewPassword: e.target.value});
                                clearFieldError("confirmNewPassword");
                            }}
                        />
                    </div>
                </Form>
                <div className="flex justify-end gap-2">
                    <Button
                        color="default"
                        variant="flat"
                        size="sm"
                        onPress={handleCancel}
                        isDisabled={updatePasswordMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        variant="solid"
                        size="sm"
                        type="submit"
                        form="password-change-form"
                        isLoading={updatePasswordMutation.isPending}
                        isDisabled={isSaveDisabled || updatePasswordMutation.isPending}
                    >
                        Save
                    </Button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmPasswordChangeModal.isOpen}
                onOpenChange={confirmPasswordChangeModal.onOpenChange}
                headerText="Confirm Password Change"
                bodyText={
                    <>
                        <p>
                            Are you sure you want to change your password?
                        </p>
                        <p className="mt-2">
                            You will be logged out on all devices.
                        </p>
                    </>
                }
                confirmFunction={confirmPasswordChange}
            />
        </>
    )
}