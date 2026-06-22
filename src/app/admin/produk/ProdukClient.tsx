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
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800">
          {form.id ? "Ubah Produk" : "Tambah Produk"}
        </h2>

        {error && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">{error}</p>}

        <div>
          <label className="text-xs font-medium text-stone-500">Nama</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500">Kategori</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
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
          <label className="text-xs font-medium text-stone-500">Harga</label>
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500">Stok</label>
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : form.id ? "Simpan" : "Tambah"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2">
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
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
                <tr key={product.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium text-stone-700">{product.name}</td>
                  <td className="px-3 py-2">{formatRupiah(product.price)}</td>
                  <td className="px-3 py-2">{product.stock}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        product.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(product)} className="mr-2 text-amber-700 hover:underline">
                      Ubah
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-stone-400">
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
