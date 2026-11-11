import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export async function UserNav() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="hidden sm:inline text-xs text-muted-foreground">
          {email}
        </span>
      )}
      <LogoutButton variant="outline" size="sm" />
    </div>
  );
}
