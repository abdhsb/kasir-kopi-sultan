"use client";

export interface ReceiptItem {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ReceiptData {
  id: string;
  createdAt: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number | null;
  paymentProofUrl?: string | null;
  notes?: string | null;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Receipt({ data, onClose }: { data: ReceiptData; onClose?: () => void }) {
  const change = data.cashReceived != null ? Math.max(0, data.cashReceived - data.total) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-transparent print:p-0">
      <div
        id="receipt-print-area"
        className="w-full max-w-sm rounded-lg border border-orange-500/20 bg-neutral-900 p-5 text-sm shadow-2xl print:rounded-none print:border-0 print:bg-white print:text-black"
      >
        <div className="text-center">
          <p className="text-lg font-bold text-white print:text-black">Kopi Sultan</p>
          <p className="text-xs text-neutral-400 print:text-black">{formatDate(data.createdAt)}</p>
          <p className="text-xs text-neutral-400 print:text-black">Kasir: {data.cashierName}</p>
          <p className="text-xs text-neutral-500 print:text-black">#{data.id.slice(0, 8)}</p>
        </div>

        <div className="my-3 space-y-1 border-t border-dashed border-neutral-700 pt-3 print:border-black">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-neutral-200 print:text-black">
              <span>
                {item.product_name} x{item.quantity}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-dashed border-neutral-700 pt-3 text-neutral-200 print:border-black print:text-black">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(data.subtotal)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-orange-400 print:text-black">
              <span>Diskon</span>
              <span>-{formatRupiah(data.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatRupiah(data.total)}</span>
          </div>
          <div className="flex justify-between text-xs uppercase text-neutral-400 print:text-black">
            <span>Metode</span>
            <span>{data.paymentMethod}</span>
          </div>
          {data.cashReceived != null && (
            <>
              <div className="flex justify-between text-xs text-neutral-400 print:text-black">
                <span>Uang diterima</span>
                <span>{formatRupiah(data.cashReceived)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 print:text-black">
                <span>Kembalian</span>
                <span>{formatRupiah(change ?? 0)}</span>
              </div>
            </>
          )}
        </div>

        {data.paymentProofUrl && (
          <div className="mt-3 border-t border-dashed border-neutral-700 pt-3 print:border-black">
            <p className="mb-1 text-xs text-neutral-400 print:text-black">Bukti pembayaran QRIS</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.paymentProofUrl} alt="Bukti pembayaran QRIS" className="mx-auto h-32 w-32 rounded-md object-cover" />
          </div>
        )}

        {data.notes && (
          <div className="mt-3 border-t border-dashed border-neutral-700 pt-3 print:border-black">
            <p className="text-xs text-neutral-400 print:text-black">Catatan: {data.notes}</p>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-neutral-500 print:text-black">Terima kasih telah berbelanja</p>

        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400"
          >
            Cetak Struk
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500/40"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
