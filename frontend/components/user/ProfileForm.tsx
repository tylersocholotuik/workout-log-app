import {useMemo, useState} from "react";

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
import {updateUserInfo} from "@/lib/api/users";
import {User, PatchUser} from "@/types";
import {
    runValidators,
    validateEmail,
    validateFirstName,
    validateLastName,
    validateDisplayName,
} from "@/lib/validation/userValidation";

import ConfirmationModal from "@/components/shared/ConfirmationModal";

export default function ProfileForm() {
    const {user, isLoading, refreshUser} = useAuth();

    if (isLoading || !user) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner size="lg" color="primary"/>
            </div>
        );
    }

    return <ProfileFormFields key={user.id} user={user}/>;
}

interface ProfileFormFieldsProps {
    user: User;
}

function ProfileFormFields({user}: ProfileFormFieldsProps) {
    const {refreshUser} = useAuth();

    const [formData, setFormData] = useState({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName || ""
    });

    const [errors, setErrors] = useState({
        email: "",
        firstName: "",
        lastName: "",
        displayName: ""
    });

    const updateProfileMutation = useMutation({
        mutationFn: (patch: PatchUser) => updateUserInfo(patch),
        onSuccess: (updatedUser) => {
            refreshUser(updatedUser);
            let toastMessage = "Your profile has been updated.";

            // Confirmation is sent to the old email address, not the new one.
            // This is to inform users that did not initiate the change that their email was changed 
            // and action may be required to secure their account.
            if (user.email !== updatedUser.email) {
                toastMessage += ` A confirmation email has been sent to ${user.email}.`;
            }

            addToast({
                description: toastMessage,
                color: "success"
            });
        }
    });

    // Compares the current form values against the original user record and
    // keeps only the fields that actually changed
    const patch = useMemo((): PatchUser => {
        const result: PatchUser = {};

        if (formData.email !== user.email) {
            result.email = formData.email;
        }
        if (formData.firstName !== user.firstName) {
            result.firstName = formData.firstName;
        }
        if (formData.lastName !== user.lastName) {
            result.lastName = formData.lastName;
        }
        // Display Name can be empty
        if (formData.displayName !== (user.displayName ?? "")) {
            result.displayName = formData.displayName;
        }

        return result;
    }, [formData, user]);

    const isDirty = Object.keys(patch).length > 0;

    const clearFieldError = (field: keyof typeof errors) => {
        setErrors((prev) => ({...prev, [field]: ""}));
    };

    const emailChangeConfirmationModal = useDisclosure();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationErrors = runValidators(formData, {
            email: validateEmail,
            firstName: validateFirstName,
            lastName: validateLastName,
            displayName: validateDisplayName,
        });

        setErrors({
            email: validationErrors.email ?? "",
            firstName: validationErrors.firstName ?? "",
            lastName: validationErrors.lastName ?? "",
            displayName: validationErrors.displayName ?? "",
        });

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        if (formData.email !== user.email) {
            emailChangeConfirmationModal.onOpen();
        } else {
            updateProfileMutation.mutate(patch);
        }
    };
    
    const confirmEmailChange = async () => {
       await updateProfileMutation.mutateAsync(patch);
    }

    const handleCancel = () => {
        setFormData({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName || ""
        });
        setErrors({email: "", firstName: "", lastName: "", displayName: ""});
    };

    return (
        <>
            <div className="flex flex-col gap-4 max-w-full w-[340px] sm:w-[500px] mx-auto mt-6">
                <Form
                    className="w-full"
                    id="profile-form"
                    validationBehavior="aria"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-4 w-full">
                        <Input
                            isRequired
                            id="email"
                            name="email"
                            label="Email"
                            labelPlacement="outside"
                            placeholder="Enter your email"
                            type="email"
                            validate={() => errors.email || undefined}
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({...formData, email: e.target.value});
                                clearFieldError("email");
                            }}
                        />
                        <Input
                            isRequired
                            id="firstName"
                            name="firstName"
                            label="First Name"
                            labelPlacement="outside"
                            placeholder="Enter your first name"
                            validate={() => errors.firstName || undefined}
                            value={formData.firstName}
                            onChange={(e) => {
                                setFormData({...formData, firstName: e.target.value});
                                clearFieldError("firstName");
                            }}
                        />
                        <Input
                            isRequired
                            id="lastName"
                            name="lastName"
                            label="Last Name"
                            labelPlacement="outside"
                            placeholder="Enter your last name"
                            validate={() => errors.lastName || undefined}
                            value={formData.lastName}
                            onChange={(e) => {
                                setFormData({...formData, lastName: e.target.value});
                                clearFieldError("lastName");
                            }}
                        />
                        <Input
                            id="displayName"
                            name="displayName"
                            label="Display Name"
                            labelPlacement="outside"
                            placeholder="Enter your display name"
                            description="Maximum 25 characters"
                            maxLength={25}
                            validate={() => errors.displayName || undefined}
                            value={formData.displayName}
                            onChange={(e) => {
                                setFormData({...formData, displayName: e.target.value});
                                clearFieldError("displayName");
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
                        isDisabled={!isDirty || updateProfileMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        variant="solid"
                        size="sm"
                        type="submit"
                        form="profile-form"
                        isLoading={updateProfileMutation.isPending}
                        isDisabled={!isDirty || updateProfileMutation.isPending}
                    >
                        Save
                    </Button>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={emailChangeConfirmationModal.isOpen}
                onOpenChange={emailChangeConfirmationModal.onOpenChange}
                headerText="Confirm Email Change"
                bodyText={
                    <>
                        <p>
                            Are you sure you want to change your email address to <strong>{formData.email}</strong>?
                        </p>
                        <p className="mt-2">
                            If this email address is incorrect, you will not receive password reset emails or other important notifications.
                        </p>
                    </>
                }
                confirmFunction={confirmEmailChange}
            />
        </>
    )
}