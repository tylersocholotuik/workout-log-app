import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { supabase } from "@/utils/supabase/supabaseClient";

import { useAuth } from "@/components/auth/AuthProvider";

import { useDisclosure } from "@nextui-org/react";

import LoginModal from "@/components/LoginModal";

export default function Home() {
  
  const { user } = useAuth();

  const loginModal = useDisclosure();

  // listening for the user sign in event to display the welcome modal
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
        (event) => {
            if (event === "INITIAL_SESSION") {
                loginModal.onOpen();
            } if (event === "SIGNED_IN") {
                loginModal.onOpen();
            }
        }
    );
}, []);

  return <>
    <LoginModal 
      isOpen={loginModal.isOpen}
      onOpenChange={loginModal.onOpenChange}
      displayName={user?.user_metadata.display_name ?? user?.email}
    />
  </>
}
