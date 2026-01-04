"use client";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/app/components/AuthenticatedLayout";
import { supabase } from "@/app/lib/supabase";
import { useRef, useEffect as useEffectChart } from "react";
// Chart.js dynamic import for Next.js compatibility
let Chart: any = null;
if (typeof window !== "undefined") {
	import("chart.js/auto").then((mod) => {
		Chart = mod.default;
	});
}

export default function ClosedEventsPage() {
		// --- HOOKS & STATE ---
		const [events, setEvents] = useState<any[]>([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState<string | null>(null);
		const [dateFrom, setDateFrom] = useState("");
		const [dateTo, setDateTo] = useState("");
		const [manager, setManager] = useState("");
		const [eventName, setEventName] = useState("");
		const [shift, setShift] = useState("");
		const [day, setDay] = useState("");
		const [managers, setManagers] = useState<string[]>([]);
		const [eventNames, setEventNames] = useState<string[]>([]);
		// const netSalesRef = useRef(null);
		// const expensesRef = useRef(null);
		// const gratuityRef = useRef(null);

		// --- DATA FETCH & MAPPING ---
		useEffect(() => {
			setLoading(true);
			supabase
				.from("master_closed_events")
				.select("*")
				.then(({ data, error }) => {
					if (error) setError(error.message);
					else {
						// Flatten totals and expenseTotals into event_info for each event
						const mapped = (data as any[]).map(ev => {
							const event_info = { ...ev.event_info };
							// Buscar en varios lugares posibles
							const netSales = ev.totals?.totalNetSales ?? ev.totalNetSales ?? ev.total_net_sales ?? ev.net_sales ?? null;
							const gratuity = ev.totals?.totalGratuity ?? ev.totalGratuity ?? ev.total_gratuity ?? ev.gratuity ?? null;
							const expenses = ev.expenseTotals?.totalExpenses ?? ev.totalExpenses ?? ev.total_expenses ?? ev.expenses ?? null;
							// Add CC Sales and Cash Sales
							const ccSales = ev.totals?.totalCCSales ?? ev.totals?.ccSales ?? ev.totalCCSales ?? ev.ccSales ?? ev.total_cc_sales ?? ev.cc_sales ?? ev.event_info?.ccSales ?? null;
							const cashSales = ev.totals?.totalCashSales ?? ev.totals?.cashSales ?? ev.totalCashSales ?? ev.cashSales ?? ev.total_cash_sales ?? ev.cash_sales ?? ev.event_info?.cashSales ?? null;
							if (typeof netSales === "number" && !isNaN(netSales)) event_info.totalNetSales = netSales;
							if (typeof gratuity === "number" && !isNaN(gratuity)) event_info.totalGratuity = gratuity;
							if (typeof expenses === "number" && !isNaN(expenses)) event_info.totalExpenses = expenses;
							if (typeof ccSales === "number" && !isNaN(ccSales)) event_info.ccSales = ccSales;
							if (typeof cashSales === "number" && !isNaN(cashSales)) event_info.cashSales = cashSales;
							return { ...ev, event_info };
						});
						setEvents(mapped || []);
						// Populate filter dropdowns
						setManagers([...new Set(mapped.map(ev => ev.event_info?.manager).filter(Boolean))]);
						setEventNames([...new Set(mapped.map(ev => ev.event_info?.eventName).filter(Boolean))]);
					}
					setLoading(false);
				});
		}, []);

		// --- FILTERED EVENTS & CHART DATA ---
		const filtered = events.filter(ev => {
			const info = ev.event_info || {};
			if (dateFrom && info.date < dateFrom) return false;
			if (dateTo && info.date > dateTo) return false;
			if (manager && info.manager !== manager) return false;
			if (eventName && info.eventName !== eventName) return false;
			if (shift && info.shift !== shift) return false;
			if (day && info.day !== day) return false;
			return true;
		});
		// const chartLabels = filtered.map(ev => ev.event_info?.date || "");
		// const netSalesData = filtered.map(ev => typeof ev.event_info?.totalNetSales === "number" ? ev.event_info.totalNetSales : 0);
		// const expensesData = filtered.map(ev => typeof ev.event_info?.totalExpenses === "number" ? ev.event_info.totalExpenses : 0);
		// const gratuityData = filtered.map(ev => typeof ev.event_info?.totalGratuity === "number" ? ev.event_info.totalGratuity : 0);

		// --- CHARTS ---
		// (Gráficas deshabilitadas temporalmente)

		// --- EXPORT TO EXCEL ---
		const handleExport = async () => {
			const XLSX = await import("xlsx");
			const ws = XLSX.utils.json_to_sheet(filtered.map(ev => ({
				Date: ev.event_info?.date,
				Day: ev.event_info?.day,
				Event: ev.event_info?.eventName,
				Shift: ev.event_info?.shift,
				Manager: ev.event_info?.manager,
				"Net Sales": ev.event_info?.totalNetSales,
				"CC Sales": ev.event_info?.ccSales,
				"Cash Sales": ev.event_info?.cashSales,
				Expenses: ev.event_info?.totalExpenses,
				Gratuity: ev.event_info?.totalGratuity,
				Status: "CLOSED"
			})));
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Closed Events");
			XLSX.writeFile(wb, `closed-events-${new Date().toISOString().slice(0,10)}.xlsx`);
		};

		return (
			<AuthenticatedLayout>
				<div className="min-h-screen bg-[#f4f4f5] p-8">
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-3xl font-bold tracking-tight text-gray-900">CLOSED EVENTS DIRECTORY</h1>
						<button
							className="ml-4 px-4 py-2 bg-black text-white rounded font-semibold text-sm shadow hover:bg-gray-900 transition-all"
							onClick={handleExport}
						>EXPORT</button>
					</div>
					{/* Filter Bar */}
					<div className="flex flex-wrap gap-4 mb-6 bg-gray-100 p-4 rounded-lg">
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Date From</label>
							<input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition" />
						</div>
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Date To</label>
							<input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition" />
						</div>
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Manager</label>
							<select value={manager} onChange={e => setManager(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
								<option value="">All</option>
								{managers.map(m => <option key={m} value={m}>{m}</option>)}
							</select>
						</div>
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Event</label>
							<select value={eventName} onChange={e => setEventName(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
								<option value="">All</option>
								{eventNames.map(n => <option key={n} value={n}>{n}</option>)}
							</select>
						</div>
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Shift</label>
							<select value={shift} onChange={e => setShift(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
								<option value="">All</option>
								<option value="AM">AM</option>
								<option value="PM">PM</option>
								<option value="NIGHT">NIGHT</option>
							</select>
						</div>
						<div className="flex-1 min-w-[220px]">
							<label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Day</label>
							<select value={day} onChange={e => setDay(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
								<option value="">All</option>
								<option value="MONDAY">MONDAY</option>
								<option value="TUESDAY">TUESDAY</option>
								<option value="WEDNESDAY">WEDNESDAY</option>
								<option value="THURSDAY">THURSDAY</option>
								<option value="FRIDAY">FRIDAY</option>
								<option value="SATURDAY">SATURDAY</option>
								<option value="SUNDAY">SUNDAY</option>
							</select>
						</div>
						<div className="flex items-end">
							{/* Export button removed as requested */}
						</div>
					</div>
					{/* (Gráficas deshabilitadas temporalmente) */}
					{/* Table Section */}
					<div className="bg-white rounded-lg shadow overflow-x-auto mt-6">
						<table className="min-w-full text-sm">
							<thead className="bg-gray-900 text-white">
								<tr>
									<th className="px-4 py-3 text-left font-semibold uppercase">DATE</th>
									<th className="px-4 py-3 text-left font-semibold uppercase">DAY</th>
									<th className="px-4 py-3 text-left font-semibold uppercase">EVENT</th>
									<th className="px-4 py-3 text-left font-semibold uppercase">SHIFT</th>
									<th className="px-4 py-3 text-left font-semibold uppercase">MANAGER</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">NET SALES</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">CC SALES</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">CASH SALES</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">TOTAL EXPENSES</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">TOTAL GRATUITY</th>
									<th className="px-4 py-3 text-center font-semibold uppercase">STATUS</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={11} className="text-center py-8 text-gray-400">Loading...</td></tr>
								) : error ? (
									<tr><td colSpan={11} className="text-center py-8 text-red-400">{error}</td></tr>
								) : filtered.length === 0 ? (
									<tr><td colSpan={11} className="text-center py-8 text-gray-400">No closed events found.</td></tr>
								) : (
									filtered.map(ev => (
										<tr key={ev.id} className="border-b hover:bg-gray-50 transition">
											<td className="px-4 py-2 uppercase">{ev.event_info?.date?.toUpperCase?.() ?? ""}</td>
											<td className="px-4 py-2 uppercase">{ev.event_info?.day?.toUpperCase?.() ?? ""}</td>
											<td className="px-4 py-2 uppercase">{ev.event_info?.eventName?.toUpperCase?.() ?? ""}</td>
											<td className="px-4 py-2 uppercase">{ev.event_info?.shift?.toUpperCase?.() ?? ""}</td>
											<td className="px-4 py-2 uppercase">{ev.event_info?.manager?.toUpperCase?.() ?? ""}</td>
											<td className="px-4 py-2 text-center uppercase">
												{typeof ev.event_info?.totalNetSales === "number" && !isNaN(ev.event_info?.totalNetSales)
													? `$${ev.event_info.totalNetSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
													: "$0.00"}
											</td>
											<td className="px-4 py-2 text-center uppercase">
												{typeof ev.event_info?.ccSales === "number" && !isNaN(ev.event_info?.ccSales)
													? `$${ev.event_info.ccSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
													: "N/A"}
											</td>
											<td className="px-4 py-2 text-center uppercase">
												{typeof ev.event_info?.cashSales === "number" && !isNaN(ev.event_info?.cashSales)
													? `$${ev.event_info.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
													: "N/A"}
											</td>
											<td className="px-4 py-2 text-center uppercase">
												{typeof ev.event_info?.totalExpenses === "number" && !isNaN(ev.event_info?.totalExpenses)
													? `$${ev.event_info.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
													: "$0.00"}
											</td>
											<td className="px-4 py-2 text-center uppercase">
												{typeof ev.event_info?.totalGratuity === "number" && !isNaN(ev.event_info?.totalGratuity)
													? `$${ev.event_info.totalGratuity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
													: "$0.00"}
											</td>
											<td className="px-4 py-2 text-center flex justify-center uppercase">
												<span className="mr-2">CLOSED</span>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</AuthenticatedLayout>
		);
	}
