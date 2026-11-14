import { useMemo, useState } from "react";

import {useAuth} from "@/components/auth/AuthProvider";
import {useSettings, userSettingsQueryKey} from "@/components/user/SettingsProvider";

import {
    Form,
    RadioGroup,
    Radio,
    Switch,
    Button,
    addToast,
    Spinner
} from "@heroui/react";

import { useQueryClient, useMutation } from "@tanstack/react-query";

import { updateUserSettings } from "@/lib/api/users";
import { 
    User, 
    UserSettings, 
    WeightUnit,
    DistanceUnit,
    EffortRatingType,
    Theme
} from "@/types";
import {DISTANCE_UNIT_LABELS} from "@/lib/constants/labels";

export default function PreferencesForm() {
    const { user, isLoading: isUserLoading } = useAuth();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    if (isUserLoading || isSettingsLoading || !user || !settings) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner size="lg" color="primary"/>
            </div>
        );
    }

    return <PreferencesFormFields 
        key={user.id} 
        user={user} settings={settings} 
    />;
}

interface PreferencesFormFieldsProps {
    user: User;
    settings: UserSettings;
}

function PreferencesFormFields({ user, settings }: PreferencesFormFieldsProps) {
    const queryClient = useQueryClient();

    const updatePreferencesMutation = useMutation({
        mutationFn: (patch: Partial<UserSettings>) => updateUserSettings(patch),
        onSuccess: (updated) => {
            queryClient.setQueryData(userSettingsQueryKey(user.id), updated);

            addToast({
                description: "Your preferences have been updated.",
                color: "success",
            });
        },
    });

    const [formData, setFormData] = useState({
        theme: settings.theme,
        weightUnit: settings.weightUnit,
        distanceUnit: settings.distanceUnit,
        effortType: settings.effortType,
        showOneRepMax: settings.showOneRepMax,
    });

    // Compares the current form values against the original settings record and
    // keeps only the fields that actually changed
    const patch = useMemo((): Partial<UserSettings> => {
        const result: Partial<UserSettings> = {};

        if (formData.theme !== settings.theme) {
            result.theme = formData.theme;
        }
        if (formData.weightUnit !== settings.weightUnit) {
            result.weightUnit = formData.weightUnit;
        }
        if (formData.distanceUnit !== settings.distanceUnit) {
            result.distanceUnit = formData.distanceUnit;
        }
        if (formData.effortType !== settings.effortType) {
            result.effortType = formData.effortType;
        }
        if (formData.showOneRepMax !== settings.showOneRepMax) {
            result.showOneRepMax = formData.showOneRepMax;
        }

        return result;
    }, [formData, settings, user]);

    const isDirty = Object.keys(patch).length > 0;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        updatePreferencesMutation.mutate(patch);
    };

    const handleCancel = () => {
        setFormData({
            theme: settings.theme,
            weightUnit: settings.weightUnit,
            distanceUnit: settings.distanceUnit,
            effortType: settings.effortType,
            showOneRepMax: settings.showOneRepMax,
        });
    };

    return (
        <div className="flex flex-col gap-4 max-w-full w-[340px] sm:w-[500px] mx-auto mt-6">
            <Form
                className="w-full"
                id="preferences-form"
                validationBehavior="aria"
                onSubmit={handleSubmit}
            >
                <div className="flex flex-col gap-4 mx-auto">
                    <RadioGroup
                        size="sm"
                        className="w-full"
                        label="Theme"
                        id="theme"
                        name="theme"
                        orientation="horizontal"
                        value={formData.theme}
                        onValueChange={(newValue) => {
                            setFormData((prev) => ({
                                ...prev,
                                theme: newValue as Theme,
                            }));
                        }}
                    >
                        <Radio value="light">Light</Radio>
                        <Radio value="dark">Dark</Radio>
                    </RadioGroup>
                    <RadioGroup
                        size="sm"
                        className="w-full"
                        label="Default Weight Unit"
                        id="weight-unit"
                        name="weight-unit"
                        orientation="horizontal"
                        value={formData.weightUnit}
                        onValueChange={(newValue) => {
                            setFormData((prev) => ({
                                ...prev,
                                weightUnit: newValue as WeightUnit,
                            }));
                        }}
                    >
                        <Radio value="lbs">lbs</Radio>
                        <Radio value="kg">kg</Radio>
                    </RadioGroup>
                    <RadioGroup
                        size="sm"
                        className="w-full"
                        label="Default Distance Unit"
                        id="distance-unit"
                        name="distance-unit"
                        orientation="horizontal"
                        value={formData.distanceUnit}
                        onValueChange={(newValue) => {
                            setFormData((prev) => ({
                                ...prev,
                                distanceUnit: newValue as DistanceUnit,
                            }));
                        }}
                    >
                        {Object.entries(DISTANCE_UNIT_LABELS).map(([key, label]) => (
                            <Radio key={key} value={key}>
                                {label}
                            </Radio>
                        ))}
                    </RadioGroup>
                    <RadioGroup
                        size="sm"
                        className="w-full"
                        label="Default Effort Rating Type"
                        id="effort-type"
                        name="effort-type"
                        orientation="vertical"
                        value={formData.effortType}
                        onValueChange={(newValue) => {
                            setFormData((prev) => ({
                                ...prev,
                                effortType: newValue as EffortRatingType,
                            }));
                        }}
                    >
                        <Radio
                            value="rpe"
                            description="Rate of Perceived Exertion"
                        >
                            RPE
                        </Radio>
                        <Radio
                            value="rir"
                            description="Reps In Reserve"
                        >
                            RIR
                        </Radio>
                    </RadioGroup>
                    <Switch
                        size="sm"
                        isSelected={formData.showOneRepMax}
                        onValueChange={(newValue) => {
                            setFormData((prev) => ({
                                ...prev,
                                showOneRepMax: newValue,
                            }));
                        }}
                    >
                        Show estimated one-rep max (e1RM)
                    </Switch>
                </div>
            </Form>
            <div className="flex justify-end gap-2 mt-4">
                <Button
                    color="default"
                    variant="flat"
                    size="sm"
                    onPress={handleCancel}
                    isDisabled={!isDirty || updatePreferencesMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    color="primary"
                    variant="solid"
                    size="sm"
                    type="submit"
                    form="preferences-form"
                    isLoading={updatePreferencesMutation.isPending}
                    isDisabled={!isDirty || updatePreferencesMutation.isPending}
                >
                    Save
                </Button>
            </div>
        </div>
    )
}