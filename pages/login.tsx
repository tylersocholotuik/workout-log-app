import { useState, useEffect } from "react";

import { supabase } from "@/utils/supabase/supabaseClient";

import {
    Input,
    Button,
    Card,
    CardHeader,
    CardBody,
    useDisclosure
} from "@nextui-org/react";

import FeedbackModal from "@/components/workout/FeedbackModal";

export default function App() {
    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");

    const feedbackModal = useDisclosure();

    useEffect(() => {
        if (feedback !== "") {
            feedbackModal.onOpen();
        }
    }, [feedback]);

    const signInWithEmail = async () => {
        setFeedback("");
        setError("");

        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
        });

        if (error) {
            setError(`Error: ${error.message}`);
            console.error(error);
        } else {
            setFeedback(`A login link has be sent to ${email}`);
            console.log(data);
        }
    };

    return (
        <div className="flex flex-col absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2">
            <Card className="max-w-full w-[340px] sm:w-[500px]">
                <CardHeader className="justify-center">
                    <h2 className="text-lg">Login With Magic Link</h2>
                </CardHeader>
                <CardBody className="overflow-hidden">
                    <form className="flex flex-col gap-4">
                        <Input
                            isRequired
                            label="Email"
                            placeholder="Enter your email"
                            type="email"
                            variant="faded"
                            isInvalid={error !== ""}
                            errorMessage={error}
                            value={email}
                            onValueChange={setEmail}
                            onChange={() => setError("")}
                        />
                        <p className="text-sm my-6">
                            A login link from <span className="font-semibold">Supabase Auth</span>  will be sent to your email. If this is your first time, an account will be created automatically.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                fullWidth
                                color="primary"
                                onPress={signInWithEmail}
                            >
                                Send Link
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            <FeedbackModal
                isOpen={feedbackModal.isOpen}
                onOpenChange={feedbackModal.onOpenChange}
                title={
                    feedback !== "" ? "Success" : error !== "" ? "Error" : ""
                }
                message={feedback !== "" ? feedback : error !== "" ? error : ""}
                color={error !== "" ? "red-600" : "inherit"}
                setFeedback={setFeedback}
                setError={setError}
            />
        </div>
    );
}
