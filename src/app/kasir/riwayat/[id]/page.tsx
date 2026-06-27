import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RiwayatDetailClient from "./RiwayatDetailClient";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function RiwayatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .eq("cashier_id", user.id)
    .single();

  if (!transaction) notFound();

  const { data: items } = await supabase
    .from("transaction_items")
    .select("*")
    .eq("transaction_id", id);

  return (
    <div className="space-y-4 p-4">
      <RiwayatDetailClient
        data={{
          id: transaction.id,
          createdAt: transaction.created_at,
          cashierName: transaction.profiles?.full_name ?? "-",
          items: items ?? [],
          subtotal: Number(transaction.subtotal),
          discount: Number(transaction.discount),
          total: Number(transaction.total),
          paymentMethod: transaction.payment_method,
          cashReceived: transaction.cash_received != null ? Number(transaction.cash_received) : null,
          paymentProofUrl: transaction.payment_proof_url,
          notes: transaction.notes,
        }}
      />

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">Waktu</p>
        <p className="mb-3 text-neutral-200">{formatDate(transaction.created_at)}</p>

        {transaction.payment_proof_url && (
          <div className="mb-3">
            <p className="text-sm text-neutral-400">Bukti pembayaran QRIS</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={transaction.payment_proof_url}
              alt="Bukti pembayaran QRIS"
              className="mt-1 h-32 w-32 rounded-md object-cover"
            />
          </div>
        )}

        {transaction.notes && (
          <div className="mb-3">
            <p className="text-sm text-neutral-400">Catatan</p>
            <p className="text-neutral-200">{transaction.notes}</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950 text-left text-neutral-500">
              <tr>
                <th className="px-3 py-2">Produk</th>
                <th className="px-3 py-2">Harga</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2 text-neutral-200">{item.product_name}</td>
                  <td className="px-3 py-2 text-neutral-300">{formatRupiah(Number(item.price))}</td>
                  <td className="px-3 py-2 text-neutral-300">{item.quantity}</td>
                  <td className="px-3 py-2 text-neutral-200">{formatRupiah(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1 text-sm text-neutral-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(Number(transaction.subtotal))}</span>
          </div>
          {Number(transaction.discount) > 0 && (
            <div className="flex justify-between text-orange-400">
              <span>Diskon</span>
              <span>-{formatRupiah(Number(transaction.discount))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-white">
            <span>Total</span>
            <span className="text-orange-400">{formatRupiah(Number(transaction.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
