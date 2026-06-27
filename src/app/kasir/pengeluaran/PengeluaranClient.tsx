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
    <div className="space-y-4 p-4">
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm sm:grid-cols-4"
      >
        <h2 className="col-span-full text-lg font-bold text-white">Catat Pengeluaran Mendadak</h2>

        {error && <p className="col-span-full rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>}

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-400">Keterangan</label>
          <input
            required
            placeholder="Contoh: beli es batu, servis kulkas"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-orange-500/20 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">Total pengeluaran saya</p>
        <p className="text-2xl font-bold text-orange-400">{formatRupiah(total)}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-950 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Keterangan</th>
              <th className="px-3 py-2">Jumlah</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 text-neutral-300">{formatDate(exp.created_at)}</td>
                <td className="px-3 py-2 text-neutral-200">{exp.description}</td>
                <td className="px-3 py-2 text-neutral-200">{formatRupiah(Number(exp.amount))}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deletingId === exp.id}
                    className="text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === exp.id ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                  Belum ada pengeluaran.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
