"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/lib/types";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const emptyForm = { description: "", amount: "" };

export default function PengeluaranClient({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = useMemo(() => expenses.reduce((sum, exp) => sum + Number(exp.amount), 0), [expenses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi tidak ditemukan, silakan login ulang.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("expenses").insert({
      cashier_id: user.id,
      description: form.description,
      amount: Number(form.amount),
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    setDeletingId(id);

    const { error: deleteError } = await supabase.from("expenses").delete().eq("id", id);

    if (deleteError) {
      alert(deleteError.message);
    }

    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-5 p-4">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm sm:grid-cols-4"
      >
        <h2 className="col-span-full text-lg font-bold text-white">Catat Pengeluaran Mendadak</h2>

        {error && <p className="col-span-full rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-400">Keterangan</label>
          <input
            required
            placeholder="Contoh: beli es batu, servis kulkas"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Jumlah</label>
          <input
            required
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-orange-500/20 bg-neutral-900 p-5 shadow-sm">
        <p className="text-sm text-neutral-400">Total pengeluaran saya</p>
        <p className="mt-1 text-3xl font-bold text-orange-400">{formatRupiah(total)}</p>
      </div>

      <div className="space-y-3">
        {expenses.map((exp) => (
          <div key={exp.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-400">{formatDate(exp.created_at)}</p>
                <p className="mt-1 text-base font-medium text-neutral-200">{exp.description}</p>
              </div>
              <p className="whitespace-nowrap text-lg font-bold text-neutral-100">{formatRupiah(Number(exp.amount))}</p>
            </div>
            <button
              onClick={() => handleDelete(exp.id)}
              disabled={deletingId === exp.id}
              className="mt-4 w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deletingId === exp.id ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-500">
            Belum ada pengeluaran.
          </div>
        )}
      </div>
    </div>
  );
}
