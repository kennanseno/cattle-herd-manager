import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getFarmContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Could not verify the signed-in user: ${userError.message}`);
  if (!userData.user) throw new Error("A signed-in user is required to access farm records.");

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, name")
    .eq("owner_id", userData.user.id)
    .single();
  if (farmError) throw new Error(`Could not load the signed-in user's farm: ${farmError.message}`);
  return { supabase, farm };
}
