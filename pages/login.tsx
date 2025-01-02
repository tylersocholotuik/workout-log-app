import { useState } from "react";

import { supabase } from "@/utils/supabase/supabaseClient";

import {
    Tabs,
    Tab,
    Input,
    Link,
    Button,
    Card,
    CardBody,
} from "@nextui-org/react";

export default function App() {
    const [selected, setSelected] = useState("login");
    const [email, setEmail] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");

    const signInWithEmail = async () => {
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
            <Card className="max-w-full w-[340px]">
                <CardBody className="overflow-hidden">
                    <form className="flex flex-col gap-4">
                        <Input
                            isRequired
                            label="Email"
                            placeholder="Enter your email"
                            type="email"
                            value={email}
                            onValueChange={setEmail}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                fullWidth
                                color="primary"
                                onPress={signInWithEmail}
                            >
                                Login / Signup
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
            {feedback && <p>{feedback}</p>}
            {feedback && <p className="text-red-600">{error}</p>}
        </div>
    );
}
