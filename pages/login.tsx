import { useState, useEffect } from "react";

import { useRouter } from "next/router";

import { supabase } from "@/utils/supabase/supabaseClient";

import {
    Input,
    Button,
    Card,
    CardHeader,
    CardBody,
    Divider,
    useDisclosure,
    Tabs,
    Tab,
    Link,
    Alert,
} from "@nextui-org/react";

import Head from "next/head";

import FeedbackModal from "@/components/workout/FeedbackModal";

import { useAuth } from "@/components/auth/AuthProvider";

export default function App() {
    // bound to email input for magic link
    const [linkEmail, setLinkEmail] = useState("");
    // bound to inputs for email and password login
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    // bound to inputs for sign up
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [feedback, setFeedback] = useState("");
    // for general errors thrown by supabase
    const [linkError, setLinkError] = useState("");
    const [loginError, setLoginError] = useState("");
    const [signupError, setSignupError] = useState("");
    // for input specific errors
    const [linkEmailError, setLinkEmailError] = useState("");
    const [loginEmailError, setLoginEmailError] = useState("");
    const [signupEmailError, setSignupEmailError] = useState("");
    const [loginPasswordError, setLoginPasswordError] = useState("");
    const [signupPasswordError, setSignupPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");
    const [selected, setSelected] = useState("login");

    const { user, isSignedIn } = useAuth();

    const router = useRouter();

    const feedbackModal = useDisclosure();

    interface ErrorDictionary {
        field: string;
        message: string;
    }

    useEffect(() => {
        if (isSignedIn()) {
            // redirect to home page after sign in
            router.push("/");
        }
    }, [user]);

    useEffect(() => {
        if (feedback !== "") {
            feedbackModal.onOpen();
        }
    }, [feedback]);

    const signInWithEmail = async () => {
        clearErrors();
        let emailError = "";

        if (linkEmail === "") {
            emailError = "Email is required.";
        }

        if (emailError !== "") {
            setLinkEmailError(emailError);
        } else {
            const { error } = await supabase.auth.signInWithOtp({
                email: linkEmail,
                // do not want to automatically create user with link
                // user must sign up
                options: {
                    shouldCreateUser: false,
                },
            });

            if (error) {
                setLinkError(error.message);
            } else {
                setFeedback(`A login link has be sent to ${linkEmail}`);
                resetForms();
            }
        }
    };

    const loginWithPassword = async () => {
        clearErrors();
        const errors: ErrorDictionary[] = [];

        if (loginEmail === "") {
            errors.push({ field: "email", message: "Email is required." });
        }

        if (loginPassword === "") {
            errors.push({
                field: "password",
                message: "Password is required.",
            });
        }

        if (errors.length > 0) {
            errors.forEach((error) => {
                if (error.field === "email") {
                    setLoginEmailError(error.message);
                }
                if (error.field === "password") {
                    setLoginPasswordError(error.message);
                }
            });
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) {
                setLoginError(error.message);
            } else {
                resetForms();
            }
        }
    };

    const registerUser = async () => {
        clearErrors();
        const errors: ErrorDictionary[] = [];

        if (signupEmail === "") {
            errors.push({ field: "email", message: "Email is required." });
        }

        if (signupPassword === "") {
            errors.push({
                field: "password",
                message: "Password is required.",
            });
        }

        if (signupPassword !== "" && signupPassword.length < 6) {
            errors.push({
                field: "password",
                message: "Password must be at least 6 characters",
            });
        }

        if (signupPassword !== confirmPassword) {
            errors.push({
                field: "confirm_password",
                message: "Passwords do not match.",
            });
        }

        if (displayName === "") {
            errors.push({
                field: "name",
                message: "Display name is required.",
            });
        }

        if (displayName.length > 25) {
            errors.push({
                field: "name",
                message: "Display name must be less than 25 characters.",
            });
        }

        if (errors.length > 0) {
            errors.forEach((error) => {
                if (error.field === "email") {
                    setSignupEmailError(error.message);
                }
                if (error.field === "password") {
                    setSignupPasswordError(error.message);
                }
                if (error.field === "confirm_password") {
                    setSignupPasswordError(error.message);
                    setConfirmPasswordError(error.message);
                }
                if (error.field === "name") {
                    setDisplayNameError(error.message);
                }
            });
        } else {
            const { error } = await supabase.auth.signUp({
                email: signupEmail,
                password: signupPassword,
                options: {
                    data: {
                        display_name: displayName,
                    },
                },
            });

            if (error) {
                setSignupError(error.message);
            } else {
                setFeedback(
                    `A confirmation email has been sent to ${signupEmail}`
                );
                resetForms();
            }
        }
    };

    const clearErrors = () => {
        setLinkError("");
        setLoginError("");
        setSignupError("");
        setLinkEmailError("");
        setLoginEmailError("");
        setSignupEmailError("");
        setLoginPasswordError("");
        setSignupPasswordError("");
        setConfirmPasswordError("");
        setDisplayNameError("");
    };

    const resetForms = () => {
        setLinkEmail("");
        setLoginEmail("");
        setSignupEmail("");
        setLoginPassword("");
        setSignupPassword("");
        setConfirmPassword("");
        setDisplayName("");
        clearErrors();
    };

    return (
        <>
            <Head>
                <title>Login</title>
            </Head>
            <div className="container mx-auto px-2 md:px-4 py-6">
                <Card className="max-w-full w-[340px] sm:w-[500px] justify-self-center">
                    <CardHeader className="justify-center">
                        <h2 className="text-lg">Login / Sign up</h2>
                    </CardHeader>
                    <CardBody className="overflow-hidden">
                        <Tabs
                            fullWidth
                            aria-label="Login or Signup Tabs"
                            color="primary"
                            selectedKey={selected}
                            onSelectionChange={setSelected}
                        >
                            <Tab key="login" title="Login">
                                <div className="flex flex-col items-center gap-6">
                                    <h3 className="mt-2">Login with Magic Link</h3>
                                    <Input
                                        isRequired
                                        label="Email"
                                        placeholder="Enter your email"
                                        type="email"
                                        variant="bordered"
                                        isInvalid={
                                            linkEmailError !== "" ||
                                            linkError !== ""
                                        }
                                        errorMessage={
                                            linkEmailError !== ""
                                                ? linkEmailError
                                                : linkError !== ""
                                                ? linkError
                                                : undefined
                                        }
                                        value={linkEmail}
                                        onValueChange={setLinkEmail}
                                        onChange={() => {
                                            setLinkEmailError("");
                                            setLinkError("");
                                        }}
                                    />
                                    <div className="w-full">
                                        <Button
                                            fullWidth
                                            color="primary"
                                            onPress={signInWithEmail}
                                        >
                                            Send Link
                                        </Button>
                                    </div>
                                    <p className="text-sm">
                                        Check your email inbox for a link from{" "}
                                        <span className="font-semibold">
                                            Supabase Auth
                                        </span>
                                        .
                                    </p>
                                    <Divider className="mt-3" />
                                    <h3>Login with Credentials</h3>
                                    <Input
                                        isRequired
                                        label="Email"
                                        placeholder="Enter your email"
                                        type="email"
                                        variant="bordered"
                                        isInvalid={
                                            loginEmailError !== "" ||
                                            loginError !== ""
                                        }
                                        errorMessage={
                                            loginEmailError !== ""
                                                ? loginEmailError
                                                : loginError !== ""
                                                ? loginError
                                                : undefined
                                        }
                                        value={loginEmail}
                                        onValueChange={setLoginEmail}
                                        onChange={() => {
                                            setLoginEmailError("");
                                            setLoginError("");
                                        }}
                                    />
                                    <Input
                                        isRequired
                                        label="Password"
                                        placeholder="Enter your password"
                                        type="password"
                                        variant="bordered"
                                        isInvalid={
                                            loginPasswordError !== "" ||
                                            loginError !== ""
                                        }
                                        errorMessage={
                                            loginPasswordError !== ""
                                                ? loginPasswordError
                                                : loginError !== ""
                                                ? loginError
                                                : undefined
                                        }
                                        value={loginPassword}
                                        onValueChange={setLoginPassword}
                                        onChange={() => {
                                            setLoginPasswordError("");
                                            setLoginError("");
                                        }}
                                    />
                                    <p className="text-sm">
                                        Forgot your password? Login with Magic Link
                                        above.
                                    </p>
                                    <div className="w-full">
                                        <Button
                                            fullWidth
                                            color="primary"
                                            onPress={loginWithPassword}
                                        >
                                            Login
                                        </Button>
                                    </div>
                                    <p className="text-sm">
                                        Don&#39;t have an account?&nbsp;
                                        <Link
                                            className="hover:cursor-pointer"
                                            onPress={() => setSelected("signup")}
                                        >
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </Tab>
                            <Tab key="signup" title="Sign up">
                                <div className="flex flex-col items-center gap-6">
                                    <h3 className="mt-4">Sign up</h3>
                                    <Input
                                        isRequired
                                        label="Email"
                                        placeholder="Enter your email"
                                        type="email"
                                        variant="bordered"
                                        isInvalid={
                                            signupEmailError !== "" ||
                                            signupError !== ""
                                        }
                                        errorMessage={
                                            signupEmailError !== ""
                                                ? signupEmailError
                                                : signupError !== ""
                                                ? signupError
                                                : undefined
                                        }
                                        value={signupEmail}
                                        onValueChange={setSignupEmail}
                                        onChange={() => {
                                            setSignupEmailError("");
                                            setSignupError("");
                                        }}
                                    />
                                    <Input
                                        isRequired
                                        label="Password"
                                        placeholder="Enter your password"
                                        description="Minimum 6 characters"
                                        type="password"
                                        minLength={6}
                                        variant="bordered"
                                        isInvalid={signupPasswordError !== ""}
                                        errorMessage={
                                            signupPasswordError !== ""
                                                ? signupPasswordError
                                                : undefined
                                        }
                                        value={signupPassword}
                                        onValueChange={setSignupPassword}
                                        onChange={() => setSignupPasswordError("")}
                                    />
                                    <Input
                                        isRequired
                                        label="Confirm Password"
                                        placeholder="Enter your password"
                                        description="Minimum 6 characters"
                                        type="password"
                                        minLength={6}
                                        variant="bordered"
                                        isInvalid={confirmPasswordError !== ""}
                                        errorMessage={
                                            confirmPasswordError !== ""
                                                ? confirmPasswordError
                                                : undefined
                                        }
                                        value={confirmPassword}
                                        onValueChange={setConfirmPassword}
                                        onChange={() => setConfirmPasswordError("")}
                                    />
                                    <Input
                                        isRequired
                                        label="Display Name"
                                        placeholder="Enter your display name"
                                        description="Maximum 25 characters"
                                        maxLength={25}
                                        type="text"
                                        variant="bordered"
                                        isInvalid={displayNameError !== ""}
                                        errorMessage={
                                            displayNameError !== ""
                                                ? displayNameError
                                                : undefined
                                        }
                                        value={displayName}
                                        onValueChange={setDisplayName}
                                        onChange={() => setDisplayNameError("")}
                                    />
                                    <Alert
                                        color="warning"
                                        variant="bordered"
                                        title="Passwords currently can not be reset. Make sure you choose a password you can remember."
                                    />
                                    <div className="w-full mt-4">
                                        <Button
                                            fullWidth
                                            color="primary"
                                            onPress={registerUser}
                                        >
                                            Sign up
                                        </Button>
                                    </div>
                                    <p className="text-sm">
                                        Already have an account?&nbsp;
                                        <Link
                                            className="hover:cursor-pointer"
                                            onPress={() => setSelected("login")}
                                        >
                                            Login
                                        </Link>
                                    </p>
                                </div>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
                <FeedbackModal
                    isOpen={feedbackModal.isOpen}
                    onOpenChange={feedbackModal.onOpenChange}
                    title="Success"
                    message={feedback}
                    color="inherit"
                    setFeedback={setFeedback}
                    setError={setLinkError}
                />
            </div>
        </>
    );
}
