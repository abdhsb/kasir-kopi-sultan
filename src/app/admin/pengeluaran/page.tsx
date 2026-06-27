import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PERIOD_LABELS, parsePeriod, periodStart, type Period } from "@/lib/period";
import DeleteExpenseButton from "./DeleteExpenseButton";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminPengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ kasir?: string; periode?: string }>;
}) {
  const { kasir, periode } = await searchParams;
  const period = parsePeriod(periode);
  const supabase = await createClient();

  const { data: kasirList } = await supabase.from("profiles").select("id, full_name").order("full_name");

  let query = supabase
    .from("expenses")
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

  const { data: expenses } = await query;

  const total = (expenses ?? []).reduce((sum, exp) => sum + Number(exp.amount), 0);

  const periods: Period[] = ["harian", "mingguan", "bulanan", "tahunan", "semua"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/admin/pengeluaran?periode=${p}${kasir ? `&kasir=${kasir}` : ""}`}
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

      <div className="rounded-lg border border-orange-500/20 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">Total pengeluaran - {PERIOD_LABELS[period]}</p>
        <p className="text-2xl font-bold text-orange-400">{formatRupiah(total)}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-950 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Kasir</th>
              <th className="px-3 py-2">Keterangan</th>
              <th className="px-3 py-2">Jumlah</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((exp) => (
              <tr key={exp.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 text-neutral-300">{formatDate(exp.created_at)}</td>
                <td className="px-3 py-2 text-neutral-300">{exp.profiles?.full_name ?? "-"}</td>
                <td className="px-3 py-2 text-neutral-200">{exp.description}</td>
                <td className="px-3 py-2 text-neutral-200">{formatRupiah(Number(exp.amount))}</td>
                <td className="px-3 py-2 text-right">
                  <DeleteExpenseButton expenseId={exp.id} />
                </td>
              </tr>
            ))}
            {(expenses ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-neutral-500">
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
