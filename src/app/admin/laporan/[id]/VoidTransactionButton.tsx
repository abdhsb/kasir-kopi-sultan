"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VoidTransactionButton({
  transactionId,
  items,
  status,
}: {
  transactionId: string;
  items: { product_id: string; quantity: number }[];
  status: "paid" | "cancelled";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVoid() {
    if (!confirm("Batalkan transaksi ini? Stok produk akan dikembalikan.")) return;
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("id", transactionId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({ stock: product.stock + item.quantity })
          .eq("id", item.product_id);
      }
    }

    setLoading(false);
    router.refresh();
  }

  if (status === "cancelled") {
    return <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-sm text-red-400">Transaksi dibatalkan</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleVoid}
        disabled={loading}
        className="rounded-md border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Batalkan Transaksi"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
