import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PenggunaClient from "./PenggunaClient";

export default async function PenggunaPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");

  const adminClient = createAdminClient();
  const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const profilesWithEmail = (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? "-",
  }));

  return <PenggunaClient profiles={profilesWithEmail} />;
}
