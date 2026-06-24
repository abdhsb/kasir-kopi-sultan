"use client";

export default function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-orange-400"
    >
      Cetak / Export PDF
    </button>
  );
}
