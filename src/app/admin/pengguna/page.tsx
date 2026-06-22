import { createClient } from "@/lib/supabase/server";
import PenggunaClient from "./PenggunaClient";

export default async function PenggunaPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");

  return <PenggunaClient profiles={profiles ?? []} />;
}
