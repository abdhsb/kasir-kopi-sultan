export type Period = "harian" | "mingguan" | "bulanan" | "tahunan" | "semua";

export const PERIOD_LABELS: Record<Period, string> = {
  harian: "Hari ini",
  mingguan: "Minggu ini",
  bulanan: "Bulan ini",
  tahunan: "Tahun ini",
  semua: "Semua",
};

export function parsePeriod(value: string | undefined): Period {
  if (value === "harian" || value === "mingguan" || value === "bulanan" || value === "tahunan" || value === "semua") {
    return value;
  }
  return "harian";
}

export function periodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "harian") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "mingguan") {
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1));
    return monday;
  }
  if (period === "bulanan") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "tahunan") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}
