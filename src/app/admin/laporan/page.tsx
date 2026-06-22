import { createClient } from "@/lib/supabase/server";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function LaporanPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const totalToday = (transactions ?? [])
    .filter((tx) => new Date(tx.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, tx) => sum + Number(tx.total), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-stone-500">Total penjualan hari ini</p>
        <p className="text-2xl font-bold text-amber-800">{formatRupiah(totalToday)}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Kasir</th>
              <th className="px-3 py-2">Metode</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(transactions ?? []).map((tx) => (
              <tr key={tx.id} className="border-t border-stone-100">
                <td className="px-3 py-2">{formatDate(tx.created_at)}</td>
                <td className="px-3 py-2">{tx.profiles?.full_name ?? "-"}</td>
                <td className="px-3 py-2 uppercase">{tx.payment_method}</td>
                <td className="px-3 py-2">{formatRupiah(Number(tx.total))}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      tx.status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-stone-400">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
