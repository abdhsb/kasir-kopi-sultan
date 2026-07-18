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

function buildReceiptHtml(data: ReceiptData): string {
  const change = data.cashReceived != null ? Math.max(0, data.cashReceived - data.total) : null;
  const fmt = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
  const fmtDate = (v: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

  const itemRows = data.items
    .map(
      (item) =>
        `<div style="display:flex;justify-content:space-between;margin-bottom:2pt;">
          <span style="flex:1;margin-right:4pt;">${item.product_name} x${item.quantity}</span>
          <span style="white-space:nowrap;">${fmt(item.subtotal)}</span>
        </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: 58mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body {
    width: 54mm;
    margin: 0;
    padding: 0;
    font-family: 'Courier New', monospace;
    font-size: 8pt;
    color: black;
    background: white;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed black; margin: 4pt 0; padding-top: 4pt; }
  .row { display: flex; justify-content: space-between; margin-bottom: 2pt; }
  .title { font-size: 12pt; font-weight: bold; }
  .total { font-size: 10pt; font-weight: bold; }
</style>
</head>
<body>
  <div class="center">
    <p class="title">Kopi Sultan</p>
    <p>${fmtDate(data.createdAt)}</p>
    <p>Kasir: ${data.cashierName}</p>
    <p>#${data.id.slice(0, 8)}</p>
  </div>

  <div class="divider">${itemRows}</div>

  <div class="divider">
    <div class="row"><span>Subtotal</span><span>${fmt(data.subtotal)}</span></div>
    ${data.discount > 0 ? `<div class="row"><span>Diskon</span><span>-${fmt(data.discount)}</span></div>` : ""}
    <div class="row total"><span>Total</span><span>${fmt(data.total)}</span></div>
    <div class="row"><span>Metode</span><span>${data.paymentMethod.toUpperCase()}</span></div>
    ${data.cashReceived != null ? `
    <div class="row"><span>Uang diterima</span><span>${fmt(data.cashReceived)}</span></div>
    <div class="row"><span>Kembalian</span><span>${fmt(change ?? 0)}</span></div>
    ` : ""}
  </div>

  ${data.notes ? `<div class="divider"><p>Catatan: ${data.notes}</p></div>` : ""}

  <p class="center" style="margin-top:6pt;">- Terima kasih telah berbelanja -</p>
</body>
</html>`;
}

export default function Receipt({ data, onClose }: { data: ReceiptData; onClose?: () => void }) {
  const change = data.cashReceived != null ? Math.max(0, data.cashReceived - data.total) : null;

  function handlePrint() {
    const html = buildReceiptHtml(data);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-lg border border-orange-500/20 bg-neutral-900 p-5 text-sm shadow-2xl">
        <div className="text-center">
          <p className="text-lg font-bold text-white">Kopi Sultan</p>
          <p className="text-xs text-neutral-400">{formatDate(data.createdAt)}</p>
          <p className="text-xs text-neutral-400">Kasir: {data.cashierName}</p>
          <p className="text-xs text-neutral-500">#{data.id.slice(0, 8)}</p>
        </div>

        <div className="my-3 space-y-1 border-t border-dashed border-neutral-700 pt-3">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-neutral-200">
              <span className="mr-2 flex-1">{item.product_name} x{item.quantity}</span>
              <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-dashed border-neutral-700 pt-3 text-neutral-200">
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
          <div className="flex justify-between text-base font-bold text-white">
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
          <div className="mt-3 border-t border-dashed border-neutral-700 pt-3">
            <p className="text-xs text-neutral-400">Catatan: {data.notes}</p>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-neutral-500">- Terima kasih telah berbelanja -</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePrint}
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
