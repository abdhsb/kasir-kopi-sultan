"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Category, PaymentMethod, Product } from "@/lib/types";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function KasirClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [products, activeCategory]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const change = paymentMethod === "cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.product.id !== productId)
        : prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi tidak ditemukan, silakan login ulang.");
      setSubmitting(false);
      return;
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        cashier_id: user.id,
        total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? Number(cashReceived || 0) : null,
      })
      .select()
      .single();

    if (txError || !transaction) {
      setError(txError?.message ?? "Gagal membuat transaksi.");
      setSubmitting(false);
      return;
    }

    const items = cart.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("transaction_items").insert(items);

    if (itemsError) {
      setError(itemsError.message);
      setSubmitting(false);
      return;
    }

    for (const item of cart) {
      await supabase
        .from("products")
        .update({ stock: Math.max(0, item.product.stock - item.quantity) })
        .eq("id", item.product.id);
    }

    setSuccessMsg(`Transaksi berhasil. Total ${formatRupiah(total)}`);
    setCart([]);
    setCashReceived("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              activeCategory === "all" ? "bg-amber-700 text-white" : "bg-white text-stone-600 border border-stone-300"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                activeCategory === cat.id ? "bg-amber-700 text-white" : "bg-white text-stone-600 border border-stone-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="flex flex-col items-start rounded-lg border border-stone-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-400 disabled:opacity-40"
            >
              <span className="font-semibold text-stone-800">{product.name}</span>
              <span className="text-sm text-amber-700">{formatRupiah(product.price)}</span>
              <span className="mt-1 text-xs text-stone-400">Stok: {product.stock}</span>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-sm text-stone-500">Belum ada produk.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-stone-800">Keranjang</h2>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 && <p className="text-sm text-stone-400">Belum ada item.</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1">
                <p className="font-medium text-stone-700">{item.product.name}</p>
                <p className="text-stone-400">{formatRupiah(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="h-6 w-6 rounded bg-stone-100 text-stone-600"
                >
                  -
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="h-6 w-6 rounded bg-stone-100 text-stone-600"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t border-stone-200 pt-3">
          <div className="flex justify-between text-base font-bold text-stone-800">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <div className="flex gap-2">
            {(["cash", "qris", "debit"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase ${
                  paymentMethod === method ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === "cash" && (
            <div>
              <label className="text-xs font-medium text-stone-500">Uang diterima</label>
              <input
                type="number"
                min={0}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              />
              <p className="mt-1 text-xs text-stone-500">Kembalian: {formatRupiah(change)}</p>
            </div>
          )}

          {error && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">{error}</p>}
          {successMsg && <p className="rounded bg-green-50 px-2 py-1 text-xs text-green-600">{successMsg}</p>}

          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Bayar"}
          </button>
        </div>
      </div>
    </div>
  );
}
