import Head from "next/head";

import {
    Tabs,
    Tab
} from "@heroui/react";

import ProfileForm from "@/components/user/ProfileForm";
import PreferencesForm from "@/components/user/PreferencesForm";
import PasswordChangeForm from "@/components/user/PasswordChangeForm";

export default function Account() {
    return (
        <>
            <Head>
                <title>My Account</title>
                <meta
                    property="description"
                    content="Manage your account settings, including profile information, preferences, and password."
                />
            </Head>
            <main>
                <div className="container mx-auto px-2 md:px-4 py-6">
                    <h2 className="text-center text-xl mb-4">
                        My Account
                    </h2>
                    <Tabs
                        className="w-full flex justify-center"
                        variant="underlined"
                        color="primary"
                    >
                        <Tab title="Profile">
                            <ProfileForm />
                        </Tab>
                        <Tab title="Preferences">
                            <PreferencesForm />
                        </Tab>
                        <Tab title="Security">
                            <PasswordChangeForm />
                        </Tab>
                    </Tabs>
                </div>
            </main>
        </>
    )
}