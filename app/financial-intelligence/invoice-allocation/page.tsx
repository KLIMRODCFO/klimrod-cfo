"use client";
import { useState } from "react";
import MinimalDatePicker from "@/app/components/MinimalDatePicker";
import InvoiceScanner from "@/app/components/InvoiceScanner";
// import { exportInvoiceToExcel } from "@/app/lib/excel";

// Hide number input spinners for all browsers and unify number input width
const inputNumberNoArrows = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
  .number-input-unified {
    min-width: 110px !important;
    max-width: 110px !important;
    width: 110px !important;
  }
`;

interface InvoiceItem {
  id: string;
  product_ai: string;
  item: string;
  quantity: number;
  units: string;
  unit_price: number;
  amount: number;
  discrepancy?: string;
  category: string;
}

export default function InvoiceAllocationPage() {
  // Inject style to hide number input arrows
  if (typeof window !== 'undefined' && !document.getElementById('no-arrows-style')) {
    const style = document.createElement('style');
    style.id = 'no-arrows-style';
    style.innerHTML = inputNumberNoArrows;
    document.head.appendChild(style);
  }
  const [showScanner, setShowScanner] = useState(false);
  const [showImageLoadedModal, setShowImageLoadedModal] = useState(false);
  const [form, setForm] = useState({
    vendor: "",
    amount: 0,
    date: "",
    due_date: "",
    bill_number: "",
    terms: "",
    memo: "",
    tax: 0,
    shipping: 0,
    correction: 0,
    category: "food",
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Lector de facturas usando OpenAI
  const handleScan = (data: any) => {
    setForm((prev) => ({
      ...prev,
      vendor: (data.vendor || prev.vendor).toUpperCase(),
      amount: data.amount || prev.amount,
      date: data.date || prev.date,
      due_date: prev.due_date,
      bill_number: (data.delivery_number || prev.bill_number).toUpperCase(),
      terms: (data.payment_terms || prev.terms).toUpperCase(),
      memo: (data.description || prev.memo).toUpperCase(),
      tax: prev.tax,
      shipping: prev.shipping,
      correction: prev.correction,
      category: prev.category,
    }));
    if (data.items && data.items.length > 0) {
      const mappedItems = data.items.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random()}`,
        product_ai: (item.product_service || item.product_name || "").toUpperCase(),
        item: "",
        quantity: item.quantity || item.cases || item.bottles || 0,
        units: item.units || "",
        unit_price: item.unit_price || 0,
        amount: (item.quantity || item.cases || item.bottles || 0) * (item.unit_price || 0),
        discrepancy: "",
        category: "",
      }));
      setItems(mappedItems);
    }
    setShowScanner(false);
    setShowImageLoadedModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  // Derived values for summary
  const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const tax = Number(form.tax) || 0;
  const shipping = Number(form.shipping) || 0;
  const correction = Number(form.correction) || 0;
  const invoiceTotal = subtotal + tax + shipping;
  const afterCorrection = invoiceTotal - correction;

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-0">
      {/* Encabezado principal alineado a la izquierda, sin fondo blanco ni borde */}
      <div className="w-full flex flex-col items-start py-4 mb-4 pl-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-0.5">INVOICE ALLOCATION</h1>
        <span className="text-base text-blue-900 font-bold tracking-wide mb-1">TUCCI</span>
      </div>

      {/* BLOQUE 1: INVOICE SCANNER (with modal, aligned left) */}
      <div className="max-w-6xl w-full mb-2 px-0">
        <div className="p-6 pl-6 flex flex-row items-center justify-between w-full">
          <div className="flex flex-col items-start justify-end">
            <h2 className="text-xl font-bold text-[#101522] mb-4">INVOICE SCANNER</h2>
            {!showScanner && (
              <button
                onClick={() => setShowScanner(true)}
                className="bg-black text-white rounded px-6 py-3 font-semibold text-base shadow hover:bg-gray-800 transition-all"
                style={{ minWidth: 'auto' }}
              >
                UPLOAD IMAGE
              </button>
            )}
          </div>
          <div className="flex flex-col items-end justify-end">
            {/* Botón de exportación eliminado temporalmente */}
          </div>
        </div>
      </div>
      {/* Modal de escaneo de imagen */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-[#101522] mb-2">KLIMROD CFO</h2>
            <span className="text-lg text-gray-700 mb-6">IMAGE LOADED</span>
            <div className="w-full mb-4">
              <InvoiceScanner onDataExtracted={handleScan} />
            </div>
            <button
              onClick={() => setShowScanner(false)}
              className="mt-2 bg-gray-200 text-gray-800 rounded px-4 py-2 font-semibold hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* Modal de imagen cargada */}
      {showImageLoadedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-[#101522] mb-2 text-center tracking-tight">KLIMROD CFO</h2>
            <span className="text-lg text-gray-700 mb-6 text-center font-semibold">IMAGE LOADED</span>
            <button
              onClick={() => setShowImageLoadedModal(false)}
              className="w-full px-8 py-3 bg-gray-900 text-white border-2 border-gray-800 rounded font-semibold text-base hover:bg-gray-800 transition-all mt-2 tracking-wide shadow"
              style={{ letterSpacing: '0.05em' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* BLOQUE 2: GENERAL INFORMATION - estilo tabla como SALES REPORT */}
      <div className="max-w-6xl w-full mb-8 px-6">
        <h2 className="text-xl font-bold text-[#101522] pt-1 pb-4">GENERAL INFORMATION</h2>
        <div>
          <table className="w-full text-left align-top border-separate border-spacing-0">
            <tbody>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 w-1/3 text-left align-middle">INVOICE VENDOR (AI)</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <input name="invoice_vendor_ai" value={form.vendor} readOnly className="w-full border border-gray-300 px-4 py-2 bg-white text-black placeholder-gray-400 text-base font-semibold tracking-wide rounded focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[320px] max-w-[520px]" placeholder="Extracted by AI" />
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 w-1/2 text-left align-middle">SUBTOTAL</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <span className="bg-white px-2 py-1.5 text-black font-semibold text-base rounded border border-gray-300 inline-block min-w-[80px] text-center">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">INVOICE VENDOR</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <input name="vendor" value={form.vendor} onChange={handleChange} className="w-full border border-gray-300 px-4 py-2 bg-white text-black placeholder-gray-400 text-base font-semibold tracking-wide rounded focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[320px] max-w-[520px]" placeholder="Escribe el proveedor" />
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">TAX</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      name="tax"
                      value={form.tax === 0 ? '' : form.tax}
                      onChange={handleChange}
                      onBlur={e => setForm(prev => ({ ...prev, tax: e.target.value === '' ? 0 : Number(parseFloat(e.target.value).toFixed(2)) }))}
                      className="number-input-unified text-center border border-gray-300 bg-white text-black placeholder-gray-400 font-semibold text-base tracking-wide rounded pl-6 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px] max-w-[220px]"
                      placeholder="0.00"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                      step="0.01"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">INVOICE DATE</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <div className="min-w-[120px]"><MinimalDatePicker value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">SHIPPING</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      name="shipping"
                      value={form.shipping === 0 ? '' : form.shipping}
                      onChange={handleChange}
                      onBlur={e => setForm(prev => ({ ...prev, shipping: e.target.value === '' ? 0 : Number(parseFloat(e.target.value).toFixed(2)) }))}
                      className="number-input-unified text-center border border-gray-300 bg-white text-black placeholder-gray-400 font-semibold text-base tracking-wide rounded pl-6 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px] max-w-[220px]"
                      placeholder="0.00"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                      step="0.01"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">DUE DATE</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <div className="min-w-[120px]"><MinimalDatePicker value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">INVOICE TOTAL</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <span className="bg-white px-2 py-1.5 text-black font-extrabold text-lg rounded border border-gray-300 inline-block min-w-[80px] text-center">${Number(invoiceTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">BILL NUMBER</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <input name="bill_number" value={form.bill_number} onChange={handleChange} className="w-full border border-gray-300 px-4 py-2 bg-white text-black placeholder-gray-400 text-base font-semibold tracking-wide rounded focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[320px] max-w-[520px]" placeholder="Bill number" required />
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">ADJUSTMENT (SUBTRACT)</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      name="correction"
                      value={form.correction === 0 ? '' : form.correction}
                      onChange={handleChange}
                      onBlur={e => setForm(prev => ({ ...prev, correction: e.target.value === '' ? 0 : Number(parseFloat(e.target.value).toFixed(2)) }))}
                      className="number-input-unified text-center border border-gray-300 bg-white text-black placeholder-gray-400 font-semibold text-base tracking-wide rounded pl-6 pr-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px] max-w-[220px]"
                      placeholder="0.00"
                      style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                      step="0.01"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">TERMS</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top">
                  <input name="terms" value={form.terms} onChange={handleChange} className="w-full border border-gray-300 px-4 py-2 bg-white text-black placeholder-gray-400 text-base font-semibold tracking-wide rounded focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[320px] max-w-[520px]" placeholder="NET 30, COD, etc." />
                </td>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 border-b border-gray-800 text-left align-middle">AFTER ADJUSTMENT</td>
                <td className="bg-white px-4 py-2 border-b border-gray-200 align-top text-center">
                  <span className="bg-white px-2 py-1.5 text-black font-semibold text-base rounded border border-gray-300 inline-block min-w-[80px] text-center">${Number(afterCorrection).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
              </tr>
              <tr>
                <td className="bg-[#101522] text-white font-bold text-sm px-4 py-1.5 text-left align-middle">MEMO</td>
                <td className="bg-white px-4 py-2 align-top">
                  <div className="w-full bg-white rounded border border-gray-300 px-2 py-1.5 min-h-[36px] flex flex-col gap-1">
                    {items.filter(i => i.discrepancy && i.discrepancy.trim() !== "").length === 0 ? (
                      <span className="text-gray-400 text-xs">No discrepancies</span>
                    ) : (
                      items.filter(i => i.discrepancy && i.discrepancy.trim() !== "").map((i, idx) => (
                        <div key={i.id || idx} className="mb-1 flex flex-col gap-0.5">
                          <div className="font-semibold text-xs text-black leading-tight">{i.product_ai || 'PRODUCTO'}</div>
                          <div className="text-xs text-gray-500 leading-tight pl-2">{i.discrepancy}</div>
                        </div>
                      ))
                    )}
                  </div>
                </td>
                <td className="bg-white px-4 py-1.5 align-middle" colSpan={2}>
                  <div className="py-1 px-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-[11px] font-bold text-gray-700 mb-1">CATEGORY DISTRIBUTION</div>
                    {subtotal > 0 ? (
                      <div className="flex flex-col gap-1">
                        {Object.entries(items.reduce((acc, item) => {
                          const cat = item.category?.toUpperCase() || 'UNCATEGORIZED';
                          acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
                          return acc;
                        }, {} as Record<string, number>)).map(([cat, amt]) => (
                          <div key={cat} className="flex text-[11px] items-center">
                            <span className="font-semibold text-gray-600 flex-1 text-left">{cat}</span>
                            <span className="text-gray-700 w-12 text-right">{((amt / subtotal) * 100).toFixed(1)}%</span>
                            <span className="text-gray-900 font-bold w-20 text-right">${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">No items</div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOQUE 3: INVOICE ITEMS (full width, with DISCREPANCIES column) */}
      <div className="w-full mb-8 px-0">
        <h2 className="text-xl font-bold text-[#101522] pt-2 pb-4 pl-6">INVOICE ITEMS</h2>
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-[#101522] text-white text-base">
                <th className="px-4 py-3 font-bold rounded-tl-xl text-center">PRODUCT (AI)</th>
                <th className="px-4 py-3 font-bold text-center">ITEM</th>
                <th className="px-4 py-3 font-bold text-center">QTY</th>
                <th className="px-4 py-3 font-bold text-center">UNITS</th>
                <th className="px-4 py-3 font-bold text-center">UNIT PRICE</th>
                <th className="px-4 py-3 font-bold text-center">AMOUNT</th>
                <th className="px-4 py-3 font-bold text-center">CATEGORY</th>
                <th className="px-4 py-3 font-bold text-center">DISCREPANCIES</th>
                <th className="px-4 py-3 font-bold rounded-tr-xl text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-6">No items</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center uppercase"
                        value={item.product_ai}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, product_ai: e.target.value.toUpperCase() } : it))}
                        placeholder="PRODUCT"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center uppercase"
                        value={item.item}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, item: e.target.value.toUpperCase() } : it))}
                        placeholder="ITEM"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        type="number"
                        className="number-input-unified border border-gray-300 rounded px-2 py-2 text-sm text-center bg-white focus:ring-2 focus:ring-blue-200 uppercase"
                        value={item.quantity}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, quantity: e.target.value === '' ? 0 : Number(e.target.value) } : it))}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center uppercase"
                        value={item.units}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, units: e.target.value.toUpperCase() } : it))}
                        placeholder="UNITS"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        type="number"
                        className="number-input-unified border border-gray-300 rounded px-2 py-2 text-sm text-center bg-white focus:ring-2 focus:ring-blue-200 uppercase"
                        value={item.unit_price}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, unit_price: e.target.value === '' ? 0 : Number(e.target.value) } : it))}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle font-bold">
                      <input
                        type="number"
                        className="number-input-unified border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center font-bold uppercase"
                        value={item.amount === 0 ? '' : item.amount}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(items.map((it, i) => i === idx ? { ...it, amount: val === '' ? 0 : Number(val) } : it));
                        }}
                        onBlur={e => {
                          const val = e.target.value;
                          setItems(items.map((it, i) => i === idx ? { ...it, amount: val === '' ? 0 : Number(parseFloat(val).toFixed(2)) } : it));
                        }}
                        step="0.01"
                        min="0"
                        max="99999999"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        className="w-28 border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center uppercase"
                        value={item.category}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, category: e.target.value.toUpperCase() } : it))}
                        placeholder="CATEGORY"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 text-center uppercase"
                        value={item.discrepancy || ""}
                        onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, discrepancy: e.target.value.toUpperCase() } : it))}
                        placeholder="DISCREPANCY"
                      />
                    </td>
                    <td className="px-4 py-2 text-center align-middle">
                      <button
                        className="text-red-600 hover:text-red-800 font-bold text-sm"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {/* Totals row */}
              {items.length > 0 && (
                <tr className="bg-gray-50 font-bold text-gray-900 text-center">
                  <td className="px-4 py-2 text-left">TOTAL AMOUNT</td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2 text-center">{items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex flex-wrap gap-4 justify-start p-4">
            <button
              className="bg-[#101522] text-white font-semibold rounded px-5 py-2 text-base hover:bg-[#23273a] transition-all shadow"
              onClick={() => setItems([
                ...items,
                {
                  id: `item-${Date.now()}`,
                  product_ai: "",
                  item: "",
                  quantity: 0,
                  units: "",
                  unit_price: 0,
                  amount: 0,
                  discrepancy: "",
                  category: "",
                },
              ])}
            >
              + Add Row
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE 4: SUBMIT INVOICE BUTTON */}
      <div className="max-w-6xl flex justify-center pb-8 pt-2 w-full mx-auto">
        <button className="bg-[#181d2b] text-white font-semibold rounded px-6 py-2 mt-2 hover:bg-[#23273a] transition-all">SUBMIT INVOICE</button>
      </div>
    </div>
  );
}
// End of file
