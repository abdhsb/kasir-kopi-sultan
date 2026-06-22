import { createClient } from "@/lib/supabase/server";
import KasirClient from "./KasirClient";

export default async function KasirPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return <KasirClient products={products ?? []} categories={categories ?? []} />;
}
