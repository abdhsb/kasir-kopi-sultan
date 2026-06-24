import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PERIOD_LABELS, parsePeriod, periodStart, type Period } from "@/lib/period";
import DeleteTransactionButton from "@/components/DeleteTransactionButton";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ kasir?: string; periode?: string }>;
}) {
  const { kasir, periode } = await searchParams;
  const period = parsePeriod(periode);
  const supabase = await createClient();

  const { data: kasirList } = await supabase.from("profiles").select("id, full_name").order("full_name");

  let query = supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (kasir) {
    query = query.eq("cashier_id", kasir);
  }

  const start = periodStart(period);
  if (start) {
    query = query.gte("created_at", start.toISOString());
  }

  const { data: transactions } = await query;

  const totalPeriode = (transactions ?? [])
    .filter((tx) => tx.status === "paid")
    .reduce((sum, tx) => sum + Number(tx.total), 0);

  const periods: Period[] = ["harian", "mingguan", "bulanan", "tahunan", "semua"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/admin/laporan?periode=${p}${kasir ? `&kasir=${kasir}` : ""}`}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              period === p
                ? "bg-orange-500 text-black"
                : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-orange-500/40"
            }`}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-orange-500/20 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">Total penjualan - {PERIOD_LABELS[period]}</p>
        <p className="text-2xl font-bold text-orange-400">{formatRupiah(totalPeriode)}</p>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-neutral-400">Filter kasir</label>
        <form method="GET" className="flex gap-2">
          <input type="hidden" name="periode" value={period} />
          <select
            name="kasir"
            defaultValue={kasir ?? ""}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Semua kasir</option>
            {(kasirList ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-orange-400"
          >
            Terapkan
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-950 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Kasir</th>
              <th className="px-3 py-2">Metode</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(transactions ?? []).map((tx) => (
              <tr key={tx.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 text-neutral-300">{formatDate(tx.created_at)}</td>
                <td className="px-3 py-2 text-neutral-300">{tx.profiles?.full_name ?? "-"}</td>
                <td className="px-3 py-2 uppercase text-neutral-300">{tx.payment_method}</td>
                <td className="px-3 py-2 text-neutral-200">{formatRupiah(Number(tx.total))}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      tx.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/laporan/${tx.id}`} className="text-orange-400 hover:underline">
                    Detail
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">
                  <DeleteTransactionButton transactionId={tx.id} />
                </td>
              </tr>
            ))}
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-neutral-500">
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
