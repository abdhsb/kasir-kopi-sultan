"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteTransactionButton({
  transactionId,
  redirectTo,
}: {
  transactionId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Hapus transaksi ini secara permanen? Data tidak dapat dikembalikan.")) return;
    setLoading(true);
    setError(null);

    const { data, error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .select();

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("Tidak ada izin untuk menghapus transaksi ini. Pastikan migration RLS sudah dijalankan di Supabase.");
      setLoading(false);
      return;
    }

    if (redirectTo) {
      router.replace(redirectTo);
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex-1 rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? "Menghapus..." : "Hapus"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
