import { useState } from "react";

import { supabase } from "@/utils/supabase/supabaseClient";

import {Tabs, Tab, Input, Link, Button, Card, CardBody} from "@nextui-org/react";

export default function App() {
  const [selected, setSelected] = useState("login");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const signInWithEmail = async () => {
    const { data, error } = await supabase.auth.signInWithOtp({
        email: email
    });

    if (error) {
        setError(`Error: ${error.message}`);
        console.error(error);
    } else {
        setFeedback(`A login link has be sent to ${email}`);
        console.log(data);
    }
  }

  return (
    <div className="flex flex-col absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2">
      <Card className="max-w-full w-[340px] h-[400px]">
        <CardBody className="overflow-hidden">
          <Tabs
            fullWidth
            aria-label="Tabs form"
            selectedKey={selected}
            size="md"
            color="primary"
            onSelectionChange={setSelected}
          >
            <Tab key="login" title="Login">
              <form className="flex flex-col gap-4">
                <Input 
                    isRequired 
                    label="Email" 
                    placeholder="Enter your email" 
                    type="email"
                    value={email}
                    onValueChange={setEmail} 
                />
                <Input
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                />
                <p className="text-center text-small">
                  Need to create an account?{" "}
                  <Link size="sm" onPress={() => setSelected("sign-up")}>
                    Sign up
                  </Link>
                </p>
                <div className="flex gap-2 justify-end">
                  <Button fullWidth color="primary" onPress={signInWithEmail}>
                    Login
                  </Button>
                </div>
              </form>
            </Tab>
            <Tab key="sign-up" title="Sign up">
              <form className="flex flex-col gap-4 h-[300px]">
                <Input isRequired label="Name" placeholder="Enter your name" type="password" />
                <Input isRequired label="Email" placeholder="Enter your email" type="email" />
                <Input
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                />
                <p className="text-center text-small">
                  Already have an account?{" "}
                  <Link size="sm" onPress={() => setSelected("login")}>
                    Login
                  </Link>
                </p>
                <div className="flex gap-2 justify-end">
                  <Button fullWidth color="primary">
                    Sign up
                  </Button>
                </div>
              </form>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
      {feedback && <p>{feedback}</p>}
      {feedback && <p className="text-red-600">{error}</p>}
    </div>
  );
}

