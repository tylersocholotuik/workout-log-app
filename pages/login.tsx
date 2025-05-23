import { useState, useEffect } from "react";

import { useRouter } from "next/router";

import { supabase } from "@/utils/supabase/supabaseClient";

import {
  Form,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Tabs,
  Tab,
  Link,
  Alert,
  addToast,
} from "@heroui/react";

import Head from "next/head";

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
  const [selected, setSelected] = useState<number | string>("login");

  const { user, isSignedIn } = useAuth();

  const router = useRouter();

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

  const signInWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
      } else {
        addToast({
          description: `A login link has be sent to ${linkEmail}`,
          color: "success",
        });
        resetForms();
      }
    }
  };

  const loginWithPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        addToast({
          description: `Welcome ${
            data.user?.user_metadata.display_name ??
            data.user?.user_metadata.email
          }!`,
          color: "success",
        });
        resetForms();
      }
    }
  };

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        addToast({
          description: `A confirmation email has been sent to ${signupEmail}`,
          color: "success",
        });
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
        <Card className="max-w-full w-[340px] sm:w-[500px] mx-auto">
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
                  <Form
                    id="magic-link-form"
                    onSubmit={signInWithEmail}
                    className="w-full"
                    validationBehavior="aria"
                  >
                    <div className=" w-full">
                      <Input
                        isRequired
                        label="Email"
                        name="email"
                        placeholder="Enter your email"
                        type="email"
                        variant="bordered"
                        validate={(_) => {
                          if (linkEmailError !== "") {
                            return linkEmailError;
                          }
                          if (linkError !== "") {
                            return linkError;
                          }
                        }}
                        value={linkEmail}
                        onValueChange={setLinkEmail}
                        onChange={() => {
                          setLinkEmailError("");
                          setLinkError("");
                        }}
                      />
                    </div>
                  </Form>
                  <div className="w-full">
                    <Button
                      fullWidth
                      color="primary"
                      type="submit"
                      form="magic-link-form"
                    >
                      Send Link
                    </Button>
                  </div>
                  <p className="text-sm">
                    Check your email inbox for a link from{" "}
                    <span className="font-semibold">Supabase Auth</span>.
                  </p>
                  <Divider className="mt-3" />
                  <h3>Login with Credentials</h3>
                  <Form
                    id="password-login-form"
                    onSubmit={loginWithPassword}
                    className="w-full"
                    validationBehavior="aria"
                  >
                    <div className="flex flex-col gap-4 w-full">
                      <Input
                        isRequired
                        label="Email"
                        placeholder="Enter your email"
                        type="email"
                        variant="bordered"
                        validate={(_) => {
                          if (loginEmailError !== "") {
                            return loginEmailError;
                          }
                          if (loginError !== "") {
                            return loginError;
                          }
                        }}
                        name="email"
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
                        name="password"
                        placeholder="Enter your password"
                        type="password"
                        variant="bordered"
                        validate={(_) => {
                          if (loginPasswordError !== "") {
                            return loginPasswordError;
                          }
                          if (loginError !== "") {
                            return loginError;
                          }
                        }}
                        value={loginPassword}
                        onValueChange={setLoginPassword}
                        onChange={() => {
                          setLoginPasswordError("");
                          setLoginError("");
                        }}
                      />
                    </div>
                  </Form>
                  <p className="text-sm">
                    Forgot your password? Login with Magic Link above.
                  </p>
                  <div className="w-full">
                    <Button
                      fullWidth
                      color="primary"
                      type="submit"
                      form="password-login-form"
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
                  <Form
                    id="signup-form"
                    onSubmit={registerUser}
                    className="w-full"
                    validationBehavior="aria"
                  >
                    <div className="flex flex-col gap-4 w-full">
                      <Input
                        isRequired
                        label="Email"
                        placeholder="Enter your email"
                        type="email"
                        name="email"
                        variant="bordered"
                        validate={(_) => {
                          if (signupEmailError !== "") {
                            return signupEmailError;
                          }
                          if (signupError !== "") {
                            return signupError;
                          }
                        }}
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
                        name="password"
                        placeholder="Enter your password"
                        description="Minimum 6 characters"
                        type="password"
                        minLength={6}
                        variant="bordered"
                        validate={(_) => {
                          if (signupPasswordError !== "") {
                            return signupPasswordError;
                          }
                        }}
                        value={signupPassword}
                        onValueChange={setSignupPassword}
                        onChange={() => setSignupPasswordError("")}
                      />
                      <Input
                        isRequired
                        label="Confirm Password"
                        name="confirm_password"
                        placeholder="Enter your password"
                        description="Minimum 6 characters"
                        type="password"
                        minLength={6}
                        variant="bordered"
                        validate={(_) => {
                          if (confirmPasswordError !== "") {
                            return confirmPasswordError;
                          }
                        }}
                        value={confirmPassword}
                        onValueChange={setConfirmPassword}
                        onChange={() => setConfirmPasswordError("")}
                      />
                      <Input
                        isRequired
                        label="Display Name"
                        name="display_name"
                        placeholder="Enter your display name"
                        description="Maximum 25 characters"
                        maxLength={25}
                        type="text"
                        variant="bordered"
                        validate={(_) => {
                          if (displayNameError !== "") {
                            return displayNameError;
                          }
                        }}
                        value={displayName}
                        onValueChange={setDisplayName}
                        onChange={() => setDisplayNameError("")}
                      />
                    </div>
                  </Form>
                  <Alert
                    color="warning"
                    variant="bordered"
                    title="Passwords currently can not be reset. Make sure you choose a password you can remember."
                  />
                  <div className="w-full mt-4">
                    <Button
                      fullWidth
                      color="primary"
                      type="submit"
                      form="signup-form"
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
      </div>
    </>
  );
}
