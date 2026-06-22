"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

const emptyForm = { id: "", name: "", price: "", stock: "", category_id: "" };

export default function ProdukClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id || null,
    };

    const result = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setSaving(false);
    router.refresh();
  }

  async function toggleActive(product: Product) {
    await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    router.refresh();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <h2 className="text-lg font-bold text-white">
          {form.id ? "Ubah Produk" : "Tambah Produk"}
        </h2>

        {error && <p className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>}

        <div>
          <label className="text-xs font-medium text-neutral-400">Nama</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Kategori</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Harga</label>
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400">Stok</label>
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : form.id ? "Simpan" : "Tambah"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500/40"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-left text-neutral-500">
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Harga</th>
                <th className="px-3 py-2">Stok</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2 font-medium text-neutral-200">{product.name}</td>
                  <td className="px-3 py-2 text-neutral-300">{formatRupiah(product.price)}</td>
                  <td className="px-3 py-2 text-neutral-300">{product.stock}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        product.is_active ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(product)} className="mr-2 text-orange-400 hover:underline">
                      Ubah
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="text-red-400 hover:underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-neutral-500">
                    Belum ada produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
