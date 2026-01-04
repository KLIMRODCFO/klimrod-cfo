"use client";
import AuthenticatedLayout from "@/app/components/AuthenticatedLayout";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";


export default function GratuityReportPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [position, setPosition] = useState("");
  const [eventName, setEventName] = useState("");
  const [shift, setShift] = useState("");
  const [day, setDay] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeDirectory, setEmployeeDirectory] = useState<{ [name: string]: string }>({});
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Fetch master_closed_events
      const closedEventsPromise = supabase
        .from("master_closed_events")
        .select("*");
      // Fetch MASTER_EMPLOYEE_DIRECTORY for name->position mapping
      const employeeDirectoryPromise = supabase
        .from("MASTER_EMPLOYEE_DIRECTORY")
        .select("employee_name, position");

      const [{ data: closedEvents, error: closedEventsError }, { data: directoryData, error: directoryError }] = await Promise.all([
        closedEventsPromise,
        employeeDirectoryPromise
      ]);

      if (closedEventsError || directoryError) {
        setError((closedEventsError?.message || "") + (directoryError?.message ? ", " + directoryError.message : ""));
        setEvents([]);
        setEmployeeDirectory({});
      } else {
        setEvents(closedEvents || []);
        // Build employee directory from MASTER_EMPLOYEE_DIRECTORY
        const empMap: { [name: string]: string } = {};
        (directoryData || []).forEach((emp: any) => {
          if (emp.employee_name && emp.position) empMap[emp.employee_name] = emp.position;
        });
        setEmployeeDirectory(empMap);
        // Collect unique positions, event names, shifts, days from closed events
        const posSet = new Set<string>();
        const eventSet = new Set<string>();
        const shiftSet = new Set<string>();
        const daySet = new Set<string>();
        (closedEvents || []).forEach(ev => {
          // Employees/positions
          const gratuityList = ev.tip_distribution || [];
          gratuityList.forEach((emp: any) => {
            if (emp.position) posSet.add(emp.position);
            else {
              const name = emp.employee || emp.name || "";
              if (name && empMap[name]) posSet.add(empMap[name]);
            }
          });
          // Event name
          if (ev.event_info?.eventName) eventSet.add(ev.event_info.eventName);
          // Shift
          if (ev.event_info?.shift) shiftSet.add(ev.event_info.shift);
          // Day
          if (ev.event_info?.day) daySet.add(ev.event_info.day);
        });
        setPositions(Array.from(posSet));
        setEventNames(Array.from(eventSet));
        setShifts(Array.from(shiftSet));
        setDays(Array.from(daySet));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter and aggregate gratuity by employee and position from all closed events
  const tableData: {
    employee: string;
    position: string;
    cc_gratuity: number;
    cash_gratuity: number;
    points: number;
  }[] = [];
  const keyMap: { [key: string]: number } = {};
  events.forEach(ev => {
    // Filter by date, event, shift, day
    const info = ev.event_info || {};
    if (dateFrom && info.date < dateFrom) return;
    if (dateTo && info.date > dateTo) return;
    if (eventName && info.eventName !== eventName) return;
    if (shift && info.shift !== shift) return;
    if (day && info.day !== day) return;
    // Each event may have a list of employees with gratuity info
    const gratuityList = ev.tip_distribution || [];
    if (gratuityList.length > 0) {
      console.log('tip_distribution sample:', gratuityList[0]);
    }
    gratuityList.forEach((emp: any) => {
      if (emp && (emp.points !== undefined)) {
        console.log('points value:', emp.points, 'type:', typeof emp.points, 'emp:', emp);
      }
      const employee = emp.employee || emp.name || "";
      // Look up position from MASTER_EMPLOYEE_DIRECTORY mapping first
      let positionVal = "";
      if (employeeDirectory[employee]) {
        positionVal = employeeDirectory[employee];
      } else if (emp.position) {
        positionVal = emp.position;
      }
      if (!positionVal) positionVal = "UNKNOWN";
      if (position && positionVal !== position) return;
      const cc_gratuity = emp.cc_gratuity ?? emp.ccGratuity ?? emp.cc_grat ?? 0;
      const cash_gratuity = emp.cash_gratuity ?? emp.cashGratuity ?? emp.cash_grat ?? 0;
      const points = emp.points ?? 0;
      if (!employee) return;
      const key = `${employee}||${positionVal}`;
      if (keyMap[key] === undefined) {
        keyMap[key] = tableData.length;
        tableData.push({ employee, position: positionVal, cc_gratuity, cash_gratuity, points });
      } else {
        const idx = keyMap[key];
        tableData[idx].cc_gratuity += cc_gratuity;
        tableData[idx].cash_gratuity += cash_gratuity;
        tableData[idx].points += points;
      }
    });
  });

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-[#f4f4f5] p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 uppercase text-left">GRATUITY REPORT</h1>
          <button
            className="ml-4 px-4 py-2 bg-black text-white rounded font-semibold text-sm shadow hover:bg-gray-900 transition-all"
            onClick={async () => {
              const XLSX = (window as any).XLSX || (await import('xlsx'));
              (window as any).XLSX = XLSX;
              const data = tableData.map(row => ({
                Employee: row.employee,
                Position: row.position,
                'CC GRAT': row.cc_gratuity,
                'CASH GRAT': row.cash_gratuity,
                Points: row.points
              }));
              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Gratuity Report');
              XLSX.writeFile(wb, 'gratuity-report.xlsx');
            }}
          >EXPORT</button>
        </div>
        {/* Filter Bar - same style as Closed Events Directory, now with real dropdowns */}
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
            <label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Position</label>
            <select value={position} onChange={e => setPosition(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
              <option value="">All</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
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
              {shifts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1 tracking-wide">Day</label>
            <select value={day} onChange={e => setDay(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition">
              <option value="">All</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{typeof error === 'string' ? error : (error && (error as any).message) || 'Unknown error'}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            {/* Título y botón export eliminados, ahora están arriba */}
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-6 py-3 text-left font-bold uppercase tracking-wide">Employee</th>
                  <th className="px-6 py-3 text-left font-bold uppercase tracking-wide">Position</th>
                  <th className="px-6 py-3 text-right font-bold uppercase tracking-wide">CC GRAT</th>
                  <th className="px-6 py-3 text-right font-bold uppercase tracking-wide">CASH GRAT</th>
                  <th className="px-6 py-3 text-right font-bold uppercase tracking-wide">POINTS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data found.</td></tr>
                ) : (
                  <>
                    {tableData.map(row => (
                      <tr key={row.employee + row.position} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-semibold text-gray-900">{row.employee}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">{row.position}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">${row.cc_gratuity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">${row.cash_gratuity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">{row.points}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-6 py-3 text-right" colSpan={2}>TOTAL</td>
                      <td className="px-6 py-3 text-right text-gray-900">${tableData.reduce((sum, row) => sum + (typeof row.cc_gratuity === 'number' ? row.cc_gratuity : Number(row.cc_gratuity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3 text-right text-gray-900">${tableData.reduce((sum, row) => sum + (typeof row.cash_gratuity === 'number' ? row.cash_gratuity : Number(row.cash_gratuity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3 text-right text-gray-900">{tableData.reduce((sum, row) => sum + (typeof row.points === 'number' ? row.points : Number(row.points) || 0), 0)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
