import { useState, useEffect } from "react";

import { useRouter } from "next/router";

import { register, login } from "@/utils/api/auth";

import {
  Form,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Link,
  addToast,
} from "@heroui/react";

import Head from "next/head";

import { useAuth } from "@/components/auth/AuthProvider";

export default function App() {
  // bound to inputs for email and password login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // bound to inputs for sign up
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  // for general errors
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  // for input specific errors
  const [loginEmailError, setLoginEmailError] = useState("");
  const [signupEmailError, setSignupEmailError] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");
  const [signupPasswordError, setSignupPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [selected, setSelected] = useState<number | string>("login");

  const { user, isSignedIn, refreshUser } = useAuth();

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
      try {
        const response = await login({
          email: loginEmail,
          password: loginPassword,
        });

        refreshUser(); // Update user state immediately
        
        addToast({
          description: `Welcome ${
            response.user.displayName ||
            response.user.firstName
          }!`,
          color: "success",
        });
        resetForms();
        router.push("/");
      } catch (error: any) {
        setLoginError(error.message);
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
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

    if (firstName === "") {
      errors.push({ field: "firstName", message: "First name is required." });
    }

    if (lastName === "") {
      errors.push({ field: "lastName", message: "Last name is required." });
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

    if (displayName.length > 25) {
      errors.push({
        field: "displayName",
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
        if (error.field === "firstName") {
          setFirstNameError(error.message);
        }
        if (error.field === "lastName") {
          setLastNameError(error.message);
        }
        if (error.field === "displayName") {
          setDisplayNameError(error.message);
        }
      });
    } else {
      try {
        const response = await register({
          email: signupEmail,
          firstName,
          lastName,
          displayName: displayName || undefined,
          password: signupPassword,
        });

        refreshUser(); // Update user state immediately

        addToast({
          description: `Welcome ${
            response.user.displayName ||
            response.user.firstName
          }!`,
          color: "success",
        });
        resetForms();
        router.push("/");
      } catch (error: any) {
        setSignupError(error.message);
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
      }
    }
  };

  const clearErrors = () => {
    setLoginError("");
    setSignupError("");
    setLoginEmailError("");
    setSignupEmailError("");
    setLoginPasswordError("");
    setSignupPasswordError("");
    setConfirmPasswordError("");
    setFirstNameError("");
    setLastNameError("");
    setDisplayNameError("");
  };

  const resetForms = () => {
    setLoginEmail("");
    setSignupEmail("");
    setLoginPassword("");
    setSignupPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
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
                  <h3 className="mt-4">Login with Email & Password</h3>
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
                        label="First Name"
                        name="firstName"
                        placeholder="Enter your first name"
                        type="text"
                        variant="bordered"
                        validate={(_) => {
                          if (firstNameError !== "") {
                            return firstNameError;
                          }
                        }}
                        value={firstName}
                        onValueChange={setFirstName}
                        onChange={() => setFirstNameError("")}
                      />
                      <Input
                        isRequired
                        label="Last Name"
                        name="lastName"
                        placeholder="Enter your last name"
                        type="text"
                        variant="bordered"
                        validate={(_) => {
                          if (lastNameError !== "") {
                            return lastNameError;
                          }
                        }}
                        value={lastName}
                        onValueChange={setLastName}
                        onChange={() => setLastNameError("")}
                      />
                      <Input
                        label="Display Name (Optional)"
                        name="displayName"
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
                    </div>
                  </Form>
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
