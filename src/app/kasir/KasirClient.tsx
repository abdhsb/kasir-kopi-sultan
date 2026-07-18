"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Category, PaymentMethod, Product } from "@/lib/types";
import Receipt, { type ReceiptData } from "@/components/Receipt";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function ProductCard({ product, cartItem, onAdd }: { product: Product; cartItem: CartItem | undefined; onAdd: (p: Product) => void }) {
  return (
    <button
      onClick={() => onAdd(product)}
      disabled={product.stock <= 0}
      className={`relative flex flex-col items-start rounded-lg border p-3 text-left shadow-sm transition disabled:opacity-40 ${
        cartItem
          ? "border-orange-500 bg-orange-500/10 shadow-orange-900/30 ring-1 ring-orange-500"
          : "border-neutral-800 bg-neutral-900 hover:border-orange-500/50 hover:shadow-orange-900/20"
      }`}
    >
      {cartItem && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-black">
          {cartItem.quantity}
        </span>
      )}
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image_url} alt={product.name} className="mb-2 h-20 w-full rounded-md object-cover" />
      ) : (
        <span className="mb-2 flex h-20 w-full items-center justify-center rounded-md bg-neutral-800 text-2xl">☕</span>
      )}
      <span className="font-semibold text-white">{product.name}</span>
      <span className="text-sm text-orange-400">{formatRupiah(product.price)}</span>
      <span className="mt-1 text-xs text-neutral-500">Stok: {product.stock}</span>
    </button>
  );
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
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [products, activeCategory]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const discount = 0;

  const total = subtotal;

  const cashRaw = Number(cashReceived.replace(/\./g, "") || 0);
  const change = paymentMethod === "cash" ? Math.max(0, cashRaw - total) : 0;

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

  async function handleProofUpload(file: File) {
    setUploadingProof(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploadingProof(false);
      return;
    }

    const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
    setPaymentProofUrl(data.publicUrl);
    setUploadingProof(false);
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

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        cashier_id: user.id,
        subtotal,
        discount,
        total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashRaw : null,
        payment_proof_url: paymentMethod === "qris" ? paymentProofUrl : null,
        notes: notes || null,
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

    setReceipt({
      id: transaction.id,
      createdAt: transaction.created_at,
      cashierName: profile?.full_name ?? "-",
      items: cart.map((item) => ({
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === "cash" ? cashRaw : null,
      paymentProofUrl: paymentMethod === "qris" ? paymentProofUrl : null,
      notes: notes || null,
    });
    setSuccessMsg(`Transaksi berhasil. Total ${formatRupiah(total)}`);
    setCart([]);
    setCashReceived("");
    setPaymentProofUrl("");
    setNotes("");
    setSubmitting(false);
    router.refresh();
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory("all")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === "all"
                ? "bg-orange-500 text-black"
                : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-orange-500/40"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat.id
                  ? "bg-orange-500 text-black"
                  : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-orange-500/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {activeCategory === "all" ? (
          <div className="space-y-6">
            {categories.length === 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} cartItem={cart.find((i) => i.product.id === product.id)} onAdd={addToCart} />)}
                {filteredProducts.length === 0 && <p className="col-span-full text-sm text-neutral-500">Belum ada produk.</p>}
              </div>
            ) : (
              categories.map((cat) => {
                const catProducts = products.filter((p) => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-orange-400">
                      <span className="h-px flex-1 bg-orange-500/20"></span>
                      {cat.name}
                      <span className="h-px flex-1 bg-orange-500/20"></span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {catProducts.map((product) => <ProductCard key={product.id} product={product} cartItem={cart.find((i) => i.product.id === product.id)} onAdd={addToCart} />)}
                    </div>
                  </div>
                );
              })
            )}
            {(() => {
              const uncategorized = products.filter((p) => !p.category_id);
              if (uncategorized.length === 0) return null;
              return (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-neutral-500">
                    <span className="h-px flex-1 bg-neutral-700"></span>
                    Lainnya
                    <span className="h-px flex-1 bg-neutral-700"></span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {uncategorized.map((product) => <ProductCard key={product.id} product={product} cartItem={cart.find((i) => i.product.id === product.id)} onAdd={addToCart} />)}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} cartItem={cart.find((i) => i.product.id === product.id)} onAdd={addToCart} />)}
            {filteredProducts.length === 0 && <p className="col-span-full text-sm text-neutral-500">Belum ada produk.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-white">Keranjang</h2>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 && <p className="text-sm text-neutral-500">Belum ada item.</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1">
                <p className="font-medium text-neutral-200">{item.product.name}</p>
                <p className="text-neutral-500">{formatRupiah(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="h-6 w-6 rounded bg-neutral-800 text-neutral-300 hover:bg-orange-500/20 hover:text-orange-400"
                >
                  -
                </button>
                <span className="w-6 text-center text-neutral-200">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="h-6 w-6 rounded bg-neutral-800 text-neutral-300 hover:bg-orange-500/20 hover:text-orange-400"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t border-neutral-800 pt-3">
          <div className="flex justify-between text-sm text-neutral-300">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between text-base font-bold text-white">
            <span>Total</span>
            <span className="text-orange-400">{formatRupiah(total)}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Catatan tambahan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: less ice, tanpa gula, dibungkus"
              rows={2}
              className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-2">
            {(["cash", "qris", "debit"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition ${
                  paymentMethod === method
                    ? "bg-orange-500 text-black"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === "cash" && (
            <div>
              <label className="text-xs font-medium text-neutral-500">Uang diterima</label>
              <input
                type="text"
                inputMode="numeric"
                value={cashReceived}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
                  setCashReceived(raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
                }}
                placeholder="0"
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <p className="mt-1 text-xs text-neutral-500">Kembalian: {formatRupiah(change)}</p>
            </div>
          )}

          {paymentMethod === "qris" && (
            <div>
              <label className="text-xs font-medium text-neutral-500">Foto bukti pembayaran (opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProofUpload(file);
                }}
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              {uploadingProof && <p className="mt-1 text-xs text-neutral-500">Mengunggah...</p>}
              {paymentProofUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={paymentProofUrl} alt="Bukti pembayaran" className="mt-2 h-20 w-20 rounded-md object-cover" />
              )}
            </div>
          )}

          {error && <p className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{error}</p>}

          {successMsg ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-green-500/10 py-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl font-bold text-white">✓</span>
              <p className="text-sm font-semibold text-green-400">{successMsg}</p>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={submitting || uploadingProof || cart.length === 0}
              className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Bayar"}
            </button>
          )}
        </div>
      </div>

      {receipt && <Receipt data={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
