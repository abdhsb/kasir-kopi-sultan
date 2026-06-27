"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Hapus pengeluaran ini secara permanen?")) return;
    setLoading(true);

    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

    if (error) {
      alert(error.message);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-red-400 hover:underline disabled:opacity-50">
      {loading ? "Menghapus..." : "Hapus"}
    </button>
  );
}
