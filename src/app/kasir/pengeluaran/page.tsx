import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PengeluaranClient from "./PengeluaranClient";

export default async function PengeluaranPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("cashier_id", user.id)
    .order("created_at", { ascending: false });

  return <PengeluaranClient expenses={expenses ?? []} />;
}
