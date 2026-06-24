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

    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", transactionId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    if (redirectTo) {
      router.replace(redirectTo);
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? "Menghapus..." : "Hapus"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
