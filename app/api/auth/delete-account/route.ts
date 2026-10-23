import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_METADATA_COOKIE } from "@/lib/session-expiry";

const requestSchema = z.object({
  farmName: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid deletion request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the farm name to confirm deletion." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Please sign in again before deleting your farm." }, { status: 401 });
    }

    const { error: deleteError } = await supabase.rpc("delete_own_farm", {
      confirmation_name: parsed.data.farmName,
    });
    if (deleteError) {
      if (deleteError.message.includes("Farm name confirmation does not match")) {
        return NextResponse.json({ error: "The farm name does not match. Nothing was deleted." }, { status: 400 });
      }
      if (deleteError.message.includes("Farm workspace not found")) {
        return NextResponse.json({ error: "Your farm workspace could not be found." }, { status: 404 });
      }
      console.error("[auth/delete-account] Farm and account deletion failed:", deleteError.message);
      return NextResponse.json({ error: "We couldn't delete your farm. No changes were made; please try again." }, { status: 500 });
    }

    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) {
        console.error("[auth/delete-account] Local session cleanup failed after deletion:", signOutError.message);
      }
    } catch (error) {
      console.error("[auth/delete-account] Local session cleanup threw after deletion:", error);
    }

    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_METADATA_COOKIE);
    } catch (error) {
      console.error("[auth/delete-account] Session metadata cleanup failed after deletion:", error);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[auth/delete-account] Unexpected deletion failure:", error);
    return NextResponse.json({ error: "We couldn't delete your farm. Please try again." }, { status: 500 });
  }
}
