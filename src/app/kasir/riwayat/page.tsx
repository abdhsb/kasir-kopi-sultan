import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PERIOD_LABELS, parsePeriod, periodStart, type Period } from "@/lib/period";
import DeleteTransactionButton from "@/components/DeleteTransactionButton";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const period = parsePeriod(periode);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("cashier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const start = periodStart(period);
  if (start) {
    query = query.gte("created_at", start.toISOString());
  }

  const { data: transactions } = await query;

  const totalPeriode = (transactions ?? [])
    .filter((tx) => tx.status === "paid")
    .reduce((sum, tx) => sum + Number(tx.total), 0);

  const periods: Period[] = ["harian"];

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap gap-3">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/kasir/riwayat?periode=${p}`}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${
              period === p
                ? "bg-orange-500 text-black"
                : "border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-orange-500/40"
            }`}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-orange-500/20 bg-neutral-900 p-5 shadow-sm">
        <p className="text-sm text-neutral-400">Total penjualan saya - {PERIOD_LABELS[period]}</p>
        <p className="mt-1 text-3xl font-bold text-orange-400">{formatRupiah(totalPeriode)}</p>
      </div>

      <div className="space-y-3">
        {(transactions ?? []).map((tx) => (
          <div key={tx.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-400">{formatDate(tx.created_at)}</p>
                <p className="mt-1 text-lg font-bold text-neutral-100">{formatRupiah(Number(tx.total))}</p>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                  tx.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}
              >
                {tx.status}
              </span>
            </div>
            <p className="mt-2 text-sm uppercase tracking-wide text-neutral-500">{tx.payment_method}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/kasir/riwayat/${tx.id}`}
                className="flex-1 rounded-lg border border-orange-500/40 px-4 py-2.5 text-center text-sm font-medium text-orange-400 transition hover:bg-orange-500/10"
              >
                Detail
              </Link>
              <DeleteTransactionButton transactionId={tx.id} />
            </div>
          </div>
        ))}
        {(transactions ?? []).length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-500">
            Belum ada transaksi.
          </div>
        )}
      </div>
    </div>
  );
}
