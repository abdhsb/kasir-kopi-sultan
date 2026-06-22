import { createClient } from "@/lib/supabase/server";
import ProdukClient from "./ProdukClient";

export default async function ProdukPage() {
  const supabase = await createClient();

  const { data: products } = await supabase.from("products").select("*").order("name");
  const { data: categories } = await supabase.from("categories").select("*").order("name");

  return <ProdukClient products={products ?? []} categories={categories ?? []} />;
}
