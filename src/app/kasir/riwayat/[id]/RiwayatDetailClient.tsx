"use client";

import { useState } from "react";
import Link from "next/link";
import Receipt, { type ReceiptData } from "@/components/Receipt";

export default function RiwayatDetailClient({ data }: { data: ReceiptData }) {
  const [showReceipt, setShowReceipt] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/kasir/riwayat" className="text-sm text-orange-400 hover:underline">
        &larr; Kembali ke riwayat
      </Link>
      <button
        onClick={() => setShowReceipt(true)}
        className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400"
      >
        Lihat / Cetak Struk
      </button>

      {showReceipt && <Receipt data={data} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
