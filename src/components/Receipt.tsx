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
    <>
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 2mm 2mm;
          }
          body * { visibility: hidden !important; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 54mm !important;
            max-width: 54mm !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-size: 8pt !important;
            font-family: 'Courier New', monospace !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          #receipt-print-area .receipt-title {
            font-size: 11pt !important;
            font-weight: bold !important;
          }
          #receipt-print-area .receipt-total {
            font-size: 10pt !important;
            font-weight: bold !important;
          }
          #receipt-print-area .receipt-divider {
            border-top: 1px dashed black !important;
            margin: 3pt 0 !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div
          id="receipt-print-area"
          className="w-full max-w-sm rounded-lg border border-orange-500/20 bg-neutral-900 p-5 text-sm shadow-2xl"
        >
          <div className="text-center">
            <p className="receipt-title text-lg font-bold text-white">Kopi Sultan</p>
            <p className="text-xs text-neutral-400">{formatDate(data.createdAt)}</p>
            <p className="text-xs text-neutral-400">Kasir: {data.cashierName}</p>
            <p className="text-xs text-neutral-500">#{data.id.slice(0, 8)}</p>
          </div>

          <div className="receipt-divider my-3 space-y-1 border-t border-dashed border-neutral-700 pt-3">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-neutral-200">
                <span className="mr-2 flex-1">{item.product_name} x{item.quantity}</span>
                <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-divider space-y-1 border-t border-dashed border-neutral-700 pt-3 text-neutral-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-orange-400">
                <span>Diskon</span>
                <span>-{formatRupiah(data.discount)}</span>
              </div>
            )}
            <div className="receipt-total flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span>{formatRupiah(data.total)}</span>
            </div>
            <div className="flex justify-between text-xs uppercase text-neutral-400">
              <span>Metode</span>
              <span>{data.paymentMethod}</span>
            </div>
            {data.cashReceived != null && (
              <>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Uang diterima</span>
                  <span>{formatRupiah(data.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Kembalian</span>
                  <span>{formatRupiah(change ?? 0)}</span>
                </div>
              </>
            )}
          </div>

          {data.notes && (
            <div className="receipt-divider mt-3 border-t border-dashed border-neutral-700 pt-3">
              <p className="text-xs text-neutral-400">Catatan: {data.notes}</p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-neutral-500">- Terima kasih telah berbelanja -</p>

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
    </>
  );
}
