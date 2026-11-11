"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton(props: Omit<ButtonProps, "onClick">) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    // Re-render server components so the home page shows signed-out actions.
    router.refresh();
  };

  return (
    <Button {...props} onClick={logout}>
      Logout
    </Button>
  );
}
