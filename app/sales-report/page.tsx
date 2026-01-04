
"use client";

import { useState, useEffect, useRef } from 'react'
import AuthenticatedLayout from '@/app/components/AuthenticatedLayout'
import { SalesRow, SalesTotals, ExpenseRow, ExpenseTotals } from '@/app/lib/types'
import SalesTable from '@/app/components/SalesTable'
import ExpenseTable from '@/app/components/ExpenseTable'
import TipReport from '@/app/components/TipReport'
import OtherFeeTable from '@/app/components/OtherFeeTable'
// import { getTucciEmployeesForSales } from '@/app/lib/tucciBrigade'
import { generateTipReport } from '@/app/lib/tips'
import { restaurants } from '@/app/lib/restaurants'
import { supabase } from '@/app/lib/supabase'

const EVENT_OPTIONS = [
  'EVENT 1',
  'EVENT 2',
  'EVENT 3',
  'EVENT 4',
  'EVENT 5',
  'EVENT 6',
  'EVENT 7',
  'EVENT 8',
  'EVENT 9',
  'EVENT 10',
  'EVENT 11',
  'EVENT 12',
]

export default function SalesReportPage() {
  // Seguridad KLIMROD CFO
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const securityInputRef = useRef<HTMLInputElement>(null);

  // Enfocar input oculto al abrir modal
  useEffect(() => {
    if (showSecurityModal && securityInputRef.current) {
      securityInputRef.current.focus();
    }
  }, [showSecurityModal]);
  const [salesData, setSalesData] = useState<SalesRow[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseRow[]>([])
  const [otherFeeData, setOtherFeeData] = useState<Array<{employee: string, position: string}>>([])
  const [distributionMethod, setDistributionMethod] = useState<'percentage' | 'equal'>('percentage')
  const [employees, setEmployees] = useState<Array<{id: string, name: string, position: string, department?: string}>>([])
  const [managers, setManagers] = useState<Array<{id: string, name: string}>>([])

  // Solo FOH para dropdowns y Gratuity Details
  const fohEmployees = employees.filter(e => (e.department && e.department.toUpperCase() === 'FOH'));
  // State for the new Event Summary textarea
  const [eventSummary, setEventSummary] = useState('');
    // PERFORMANCE REPORT STATE AND HELPERS (must be after employees is defined)
    const [performanceRows, setPerformanceRows] = useState([
      { department: '', employee: '', position: '', report: '', note: false }
    ]);
    // Get unique departments from employees (treat MANAGER as MANAGEMENT)
    // Siempre mostrar FOH, BOH y MANAGEMENT aunque no haya empleados cargados
    // Lista completa de departamentos según Quick Onboarding
    const baseDepartments = ['FOH', 'BOH', 'MANAGEMENT', 'ADMINISTRATIVE'];
    const foundDepartments = employees
      .map(e => {
        if (e.position && e.position.toUpperCase() === 'MANAGER') return 'MANAGEMENT';
        if (e.department) return e.department.toUpperCase();
        return null;
      })
      .filter((d): d is string => Boolean(d));
    const departmentOptions: string[] = Array.from(new Set([...baseDepartments, ...foundDepartments]));
    // Filter employees by department
    const getEmployeesByDepartment = (dept: string) => {
      if (dept === 'MANAGEMENT') {
        return employees.filter(e => e.position && e.position.toUpperCase() === 'MANAGER');
      }
      if (dept === 'ADMINISTRATIVE') {
        return employees.filter(e => e.department && e.department.toUpperCase() === 'ADMINISTRATIVE');
      }
      return employees.filter(e => (e.department && e.department.toUpperCase() === dept));
    };
    const handlePerformanceChange = (idx: number, field: string, value: any) => {
      setPerformanceRows(prev => prev.map((row, i) => {
        if (i !== idx) return row;
        let updated = { ...row, [field]: value };
        // Si se selecciona un empleado, autocompletar el campo position
        if (field === 'employee') {
          const emp = employees.find(e => e.name === value);
          if (emp && emp.position) {
            updated.position = emp.position;
          }
        }
        return updated;
      }));
    };
    const handleAddPerformanceRow = () => {
      setPerformanceRows(prev => [...prev, { department: '', employee: '', position: '', report: '', note: false }]);
    };
  // ...existing code...
  // (Remove the old Event Summary and Night Summary blocks from the top)
    const handleRemovePerformanceRow = (idx: number) => {
      setPerformanceRows(prev => prev.filter((_, i) => i !== idx));
    };
  // Security modal removed
    // Security modal removed
  const [activeRestaurant, setActiveRestaurant] = useState<string>('')
  const [eventInfo, setEventInfo] = useState({
    date: '',
    day: '',
    eventName: '',
    shift: '',
    manager: '',
    otherFee: 0,
    notes: ''
  })
  const [totals, setTotals] = useState<SalesTotals>({
    totalNetSales: 0,
    totalCashSales: 0,
    totalCcSales: 0,
    totalCcGratuity: 0,
    totalCashGratuity: 0,
    totalPoints: 0,
    totalGratuity: 0,
  })
  const [expenseTotals, setExpenseTotals] = useState<ExpenseTotals>({
    totalExpenses: 0,
    totalCheck: 0,
    totalCash: 0,
    totalBusiness: 0,
    totalEmployee: 0,
    totalRefunded: 0,
  })

  useEffect(() => {
    // Load FOH employees from Supabase
    const loadEmployees = async () => {
      const restaurantId = localStorage.getItem('active_restaurant_id') || 'default';
      console.log('[SALES REPORT] restaurantId:', restaurantId);
      // TODOS LOS EMPLEADOS ACTIVOS DEL RESTAURANTE
      const { data, error } = await supabase
        .from('MASTER_EMPLOYEE_DIRECTORY')
        .select('id, employee_name, position, department, status, restaurant_id')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'ACTIVE')
        .order('employee_name', { ascending: true });
      console.log('[SALES REPORT] empleados recibidos:', data, 'error:', error);
      if (!error && data) {
        setEmployees(data.map((e: any) => ({ id: e.id, name: e.employee_name, position: e.position, department: e.department })));
      } else {
        setEmployees([]);
      }
      // MANAGERS
      const { data: mgrs, error: mgrsError } = await supabase
        .from('MASTER_EMPLOYEE_DIRECTORY')
        .select('id, employee_name')
        .eq('restaurant_id', restaurantId)
        .eq('department', 'MANAGEMENT')
        .eq('status', 'ACTIVE')
        .order('employee_name', { ascending: true });
      if (!mgrsError && mgrs) {
        setManagers(mgrs.map((m: any) => ({ id: m.id, name: m.employee_name })));
      } else {
        setManagers([]);
      }
    };
    loadEmployees();

    // Load active restaurant
    const updateActiveRestaurant = () => {
      const stored = localStorage.getItem('active_restaurant_id');
      if (stored) {
        const restaurant = restaurants.find(r => r.id === stored);
        if (restaurant) {
          setActiveRestaurant(restaurant.name);
        }
      }
    };
    updateActiveRestaurant();

    window.addEventListener('restaurant-changed', updateActiveRestaurant);
    return () => {
      window.removeEventListener('restaurant-changed', updateActiveRestaurant);
    };
  }, []);

  useEffect(() => {
    const storedInfo = localStorage.getItem('sales_event_info')
    if (storedInfo) {
      setEventInfo(JSON.parse(storedInfo))
    }
  }, [])

  useEffect(() => {
    const key = 'sales_default'
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsedData = JSON.parse(stored)
      const cleanedData = parsedData.map((row: any) => ({
        ...row,
        employee: String(row.employee || ''),
        position: String(row.position || ''),
      }))
      setSalesData(cleanedData)
    } else {
      setSalesData([])
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('expense_default')
    if (stored) {
      setExpenseData(JSON.parse(stored))
    } else {
      setExpenseData([{
        expenseName: '',
        amount: 0,
        paymentMethod: '',
        paidBy: '',
        employeeName: '',
        refunded: false,
      }])
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('other_fee_data')
    if (stored) {
      const parsed = JSON.parse(stored)
      setOtherFeeData(parsed.length > 0 ? parsed : [{ employee: '', position: '' }])
    } else {
      setOtherFeeData([{ employee: '', position: '' }])
    }
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [salesData])

  useEffect(() => {
    calculateExpenseTotals()
  }, [expenseData])

  useEffect(() => {
    localStorage.setItem('sales_event_info', JSON.stringify(eventInfo))
  }, [eventInfo])

  const calculateTotals = () => {
    const newTotals: SalesTotals = {
      totalNetSales: 0,
      totalCashSales: 0,
      totalCcSales: 0,
      totalCcGratuity: 0,
      totalCashGratuity: 0,
      totalPoints: 0,
      totalGratuity: 0,
    }

    salesData.forEach((row) => {
      newTotals.totalNetSales += row.netSales
      newTotals.totalCashSales += row.cashSales
      newTotals.totalCcSales += row.ccSales
      newTotals.totalCcGratuity += row.ccGratuity
      newTotals.totalCashGratuity += row.cashGratuity
      newTotals.totalPoints += row.points
    })

    newTotals.totalGratuity = newTotals.totalCcGratuity + newTotals.totalCashGratuity
    setTotals(newTotals)
  }

  const saveSalesData = (data: SalesRow[]) => {
    setSalesData(data)
    localStorage.setItem('sales_default', JSON.stringify(data))
  }

  const handleAddRow = () => {
    const newRow: SalesRow = {
      employee: '',
      position: '',
      netSales: 0,
      cashSales: 0,
      ccSales: 0,
      ccGratuity: 0,
      cashGratuity: 0,
      points: 0,
    }
    saveSalesData([...salesData, newRow])
  }

  const handleRemoveRow = (index: number) => {
    const updated = salesData.filter((_, i) => i !== index)
    saveSalesData(updated)
  }
  // Helper to get weekday from date string (YYYY-MM-DD)
  const getWeekdayFromDate = (dateStr: string) => {
    if (!dateStr) return '';
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return days[d.getDay()];
  };

  // Track if user has manually changed the day
  const [dayManuallySet, setDayManuallySet] = useState(false);

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'otherFee') {
      setEventInfo(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'date') {
      // When date changes, auto-set day unless user has manually set it
      const weekday = getWeekdayFromDate(value);
      setEventInfo(prev => ({
        ...prev,
        date: value,
        day: (!dayManuallySet && weekday) ? weekday : prev.day
      }));
    } else if (name === 'day') {
      setDayManuallySet(true);
      setEventInfo(prev => ({ ...prev, day: value.toUpperCase?.() ?? value }));
    } else {
      setEventInfo(prev => ({ ...prev, [name]: value.toUpperCase?.() ?? value }));
    }
  };

  const handleCellChange = (
    index: number,
    field: keyof SalesRow,
    value: string | number
  ) => {
    const updated = [...salesData]
    // Keep text fields as strings, convert numeric fields to numbers
    const finalValue = (field === 'employee' || field === 'position') 
      ? value 
      : (typeof value === 'string' ? parseFloat(value) || 0 : value)
    updated[index] = { ...updated[index], [field]: finalValue }
    
    // Auto-fill position when employee is selected, but keep editable
    if (field === 'employee' && typeof value === 'string') {
      const emp = employees.find(e => e.name === value);
      if (emp) {
        updated[index] = { ...updated[index], position: emp.position };
      }
    }
    
    saveSalesData(updated)
  }


  const handleExportEmployeeReport = () => {
    // Función de exportación eliminada
  }

  const handleSubmitClick = () => {
    if (!eventInfo.date || !eventInfo.eventName) {
      alert('Please fill in Date and Event Name before submitting');
      return;
    }
    setShowSecurityModal(true);
    setSecurityPassword('');
  };

  const handleSecuritySubmit = async () => {
    if (securityPassword !== '12345') {
      alert('Incorrect password. Access denied.');
      setSecurityPassword('');
      return;
    }
    setShowSecurityModal(false);
    setSecurityPassword('');
    try {
      // Guardar evento en localStorage y en Supabase
      const activeRestaurantId = localStorage.getItem('active_restaurant_id') || 'default';
      const tipReport = generateTipReport(salesData, distributionMethod);
      const reportId = `${eventInfo.date}_${eventInfo.eventName.replace(/\s/g, '_')}_${Date.now()}`;
      const closedEvent = {
        id: reportId,
        timestamp: new Date().toISOString(),
        restaurantId: activeRestaurantId,
        restaurantName: activeRestaurant,
        eventInfo: eventInfo,
        salesData: salesData,
        expenseData: expenseData,
        otherFeeData: otherFeeData,
        totals: totals,
        expenseTotals: expenseTotals,
        tipDistribution: tipReport.distribution,
        distributionMethod: distributionMethod
      };
      // Guardar en localStorage (histórico local)
      const existingEvents = localStorage.getItem('closed_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(closedEvent);
      localStorage.setItem('closed_events', JSON.stringify(events));

      // Guardar en Supabase
      const { error: supabaseError } = await supabase.from('master_closed_events').insert([
        {
          report_id: reportId,
          closed_at: new Date().toISOString(),
          closed_by: 'APP_USER', // Puedes reemplazar por usuario real si tienes auth
          restaurant_id: activeRestaurantId,
          restaurant_name: activeRestaurant,
          event_date: eventInfo.date,
          event_day: eventInfo.day,
          event_name: eventInfo.eventName,
          shift: eventInfo.shift,
          manager: eventInfo.manager,
          event_notes: eventInfo.notes || '',
          total_net_sales: totals.totalNetSales,
          total_cash_sales: totals.totalCashSales,
          total_cc_sales: totals.totalCcSales,
          total_cc_gratuity: totals.totalCcGratuity,
          total_cash_gratuity: totals.totalCashGratuity,
          total_points: totals.totalPoints,
          total_gratuity: totals.totalGratuity,
          total_expenses: expenseTotals.totalExpenses,
          total_check: expenseTotals.totalCheck,
          total_cash: expenseTotals.totalCash,
          total_business: expenseTotals.totalBusiness,
          total_employee: expenseTotals.totalEmployee,
          total_refunded: expenseTotals.totalRefunded,
          other_fee: eventInfo.otherFee,
          distribution_method: distributionMethod,
          event_info: eventInfo,
          sales_data: salesData,
          expense_data: expenseData,
          other_fee_data: otherFeeData,
          tip_distribution: tipReport.distribution,
          performance_report: performanceRows,
          event_summary: eventSummary,
          status: 'CLOSED',
          version: 1
        }
      ]);
      if (supabaseError) {
        alert('Error saving event to Supabase: ' + supabaseError.message);
        console.error('❌ Supabase error:', supabaseError);
        return;
      }

      // Limpiar datos para nuevo reporte
      localStorage.removeItem('sales_default');
      localStorage.removeItem('expense_default');
      localStorage.removeItem('other_fee_data');
      localStorage.removeItem('sales_event_info');

      // Limpiar estados del formulario
      setEventInfo({
        date: '',
        day: '',
        eventName: '',
        shift: '',
        manager: '',
        otherFee: 0,
        notes: ''
      });
      setSalesData([
        {
          employee: '',
          position: '',
          netSales: 0,
          cashSales: 0,
          ccSales: 0,
          ccGratuity: 0,
          cashGratuity: 0,
          points: 0,
        },
      ]);
      setExpenseData([
        {
          expenseName: '',
          amount: 0,
          paymentMethod: '',
          paidBy: '',
          employeeName: '',
          refunded: false,
        },
      ]);
      setOtherFeeData([{ employee: '', position: '' }]);
      setPerformanceRows([{ department: '', employee: '', position: '', report: '', note: false }]);
      setEventSummary('');
      setDayManuallySet(false);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert('Error saving event. Please check the console.');
    }
  }

  // Security modal removed

  // Expense functions
  const calculateExpenseTotals = () => {
    const newTotals: ExpenseTotals = {
      totalExpenses: 0,
      totalCheck: 0,
      totalCash: 0,
      totalBusiness: 0,
      totalEmployee: 0,
      totalRefunded: 0,
    }

    expenseData.forEach((row) => {
      newTotals.totalExpenses += row.amount || 0
      if (row.paymentMethod === 'CHECK') newTotals.totalCheck += row.amount || 0
      if (row.paymentMethod === 'CASH') newTotals.totalCash += row.amount || 0
      if (row.paidBy === 'BUSINESS') newTotals.totalBusiness += row.amount || 0
      if (row.paidBy === 'EMPLOYEE') newTotals.totalEmployee += row.amount || 0
      if (row.refunded && row.paidBy === 'EMPLOYEE') newTotals.totalRefunded += row.amount || 0
    })

    setExpenseTotals(newTotals)
  }

  const saveExpenseData = (data: ExpenseRow[]) => {
    setExpenseData(data)
    localStorage.setItem('expense_default', JSON.stringify(data))
  }

  const handleAddExpense = () => {
    const newRow: ExpenseRow = {
      expenseName: '',
      amount: 0,
      paymentMethod: '',
      paidBy: '',
      employeeName: '',
      refunded: false,
    }
    saveExpenseData([...expenseData, newRow])
  }

  const handleRemoveExpense = (index: number) => {
    const updated = expenseData.filter((_, i) => i !== index)
    saveExpenseData(updated)
  }

  const handleExpenseChange = (
    index: number,
    field: keyof ExpenseRow,
    value: string | number | boolean
  ) => {
    const updated = [...expenseData]
    const finalValue = (field === 'expenseName' || field === 'paymentMethod' || field === 'paidBy' || field === 'employeeName') 
      ? value 
      : (field === 'refunded' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : value))
    updated[index] = { ...updated[index], [field]: finalValue as any }
    
    // Clear employee name and refunded when paid by business
    if (field === 'paidBy' && value === 'BUSINESS') {
      updated[index] = { ...updated[index], employeeName: '', refunded: false }
    }
    
    saveExpenseData(updated)
  }

  // Other Fee handlers
  const saveOtherFeeData = (data: Array<{employee: string, position: string}>) => {
    setOtherFeeData(data)
    localStorage.setItem('other_fee_data', JSON.stringify(data))
  }

  const handleAddOtherFee = () => {
    saveOtherFeeData([...otherFeeData, { employee: '', position: '' }])
  }

  const handleRemoveOtherFee = (index: number) => {
    const updated = otherFeeData.filter((_, i) => i !== index)
    saveOtherFeeData(updated)
  }

  const handleOtherFeeChange = (
    index: number,
    field: 'employee' | 'position',
    value: string
  ) => {
    const updated = [...otherFeeData]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-fill position when employee is selected
    if (field === 'employee') {
      const emp = employees.find(e => e.name === value)
      if (emp) {
        updated[index] = { ...updated[index], position: emp.position }
      }
    }
    
    saveOtherFeeData(updated)
  }


  return (
    <AuthenticatedLayout>
      <div id="sales-report-content" className="w-full">
        <div className="px-2 pt-0 pb-2 text-left">
          <h1 className="text-3xl font-bold text-black">NEW CLOSEOUT</h1>
          {activeRestaurant && (
            <div>
              <span className="text-lg font-semibold text-gray-600">{activeRestaurant}</span>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">GENERAL INFORMATION</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Event Information Table */}
              <table className="w-full text-sm border-2 border-gray-800 rounded overflow-hidden">
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">RESTAURANT</td>
                    <td className="px-4 py-2 text-gray-900 bg-white font-bold text-center">{activeRestaurant || 'NO RESTAURANT SELECTED'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">DATE</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <input type="date" name="date" value={eventInfo.date} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded uppercase text-center" style={{ textAlign: 'center', textAlignLast: 'center', justifyContent: 'center', alignItems: 'center', display: 'flex' }} />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">DAY</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <select name="day" value={eventInfo.day} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded uppercase text-center">
                        <option value="">SELECT DAY</option>
                        <option value="MONDAY">MONDAY</option>
                        <option value="TUESDAY">TUESDAY</option>
                        <option value="WEDNESDAY">WEDNESDAY</option>
                        <option value="THURSDAY">THURSDAY</option>
                        <option value="FRIDAY">FRIDAY</option>
                        <option value="SATURDAY">SATURDAY</option>
                        <option value="SUNDAY">SUNDAY</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">EVENT</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <select name="eventName" value={eventInfo.eventName} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded uppercase text-center">
                        <option value="">SELECT EVENT</option>
                        {EVENT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">SHIFT</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <select name="shift" value={eventInfo.shift} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded uppercase text-center">
                        <option value="">SELECT SHIFT</option>
                        <option value="LUNCH">LUNCH</option>
                        <option value="BRUNCH">BRUNCH</option>
                        <option value="DINNER">DINNER</option>
                        <option value="NIGHT">NIGHT</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">MANAGER</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <select name="manager" value={eventInfo.manager} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded uppercase text-center" required>
                        <option value="">SELECT MANAGER</option>
                        {managers.map((mgr) => (
                          <option key={mgr.id} value={mgr.name}>{mgr.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">OTHER FEE</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-center">
                      <input type="number" name="otherFee" value={eventInfo.otherFee || ''} onChange={handleEventChange} className="w-full px-3 py-2 border border-gray-300 rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" step="0.01" />
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Tabla de totales */}
              <div className="mt-6">
                <table className="w-full text-sm" style={{background:'#101726', borderCollapse:'collapse'}}>
                  <tbody>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>NET SALES</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${totals.totalNetSales.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>CASH SALES</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${totals.totalCashSales.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>CASH EXPENSES</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${expenseTotals.totalCash.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#525c6a', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#525c6a'}}>HOUSE CASH</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${(totals.totalCashSales - expenseTotals.totalCash).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>CC SALES</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${totals.totalCcSales.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>CC GRATUITY</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${totals.totalCcGratuity.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr style={{background:'#101726', borderBottom:'1px solid #232b38'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>CASH GRATUITY</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${totals.totalCashGratuity.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>OTHER FEE</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>${eventInfo.otherFee.toFixed(2)}</td>
                    </tr>
                    <tr style={{background:'#101726'}}>
                      <td className="px-6 py-3 font-bold text-white text-left border-r border-[#232b38]" style={{background:'#101726'}}>TOTAL POINTS</td>
                      <td className="px-6 py-3 font-bold text-black text-right" style={{background:'#fff'}}>{totals.totalPoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">SALES AND GRATUITY DETAILS</h2>
            <SalesTable sales={salesData} onUpdate={handleCellChange} onAddRow={handleAddRow} onDeleteRow={handleRemoveRow} totals={totals} employees={fohEmployees} />
          </div>
          <div className="bg-white rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">GRATUITY DISTRIBUTION</h2>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <label className="text-sm font-semibold text-black mr-4">DISTRIBUTION METHOD</label>
                </div>
                <button className="ml-4 px-4 py-2 bg-black text-white rounded font-semibold text-sm shadow hover:bg-gray-900 transition-all" onClick={async () => {
                  if (typeof window === 'undefined') return;
                  let XLSX = window.XLSX;
                  if (!XLSX) {
                    XLSX = await import('xlsx');
                    window.XLSX = XLSX;
                  }
                  const { generateTipReport } = await import('@/app/lib/tips');
                  const fohRows = salesData.filter(row => {
                    const emp = employees.find(e => e.name === row.employee);
                    return emp && emp.department && emp.department.toUpperCase() === 'FOH';
                  });
                  const report = generateTipReport(fohRows, distributionMethod);
                  const data = report.distribution.map(row => ({
                    Employee: row.employee,
                    'Total Tips': row.tips,
                    'CC Gratuity': row.ccGratuity,
                    'Cash Gratuity': row.cashGratuity
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Gratuity Distribution');
                  XLSX.writeFile(wb, 'gratuity-distribution.xlsx');
                }}>EXPORT GRATUITY DISTRIBUTION</button>
              </div>
            </div>
            <div id="gratuity-distribution-section">
              <TipReport sales={salesData.filter(row => {
                const emp = employees.find(e => e.name === row.employee);
                return emp && emp.department && emp.department.toUpperCase() === 'FOH';
              })} distributionMethod={distributionMethod} />
            </div>
          </div>
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">OTHER FEE DISTRIBUTION</h2>
            <OtherFeeTable rows={otherFeeData} onUpdate={handleOtherFeeChange} onAddRow={handleAddOtherFee} onDeleteRow={handleRemoveOtherFee} totalFee={eventInfo.otherFee} employees={employees} />
          </div>
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">EXPENSES</h2>
            <ExpenseTable expenses={expenseData} onUpdate={handleExpenseChange} onAddRow={handleAddExpense} onDeleteRow={handleRemoveExpense} totals={expenseTotals} employees={employees} />
          </div>
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">PERFORMANCE REPORT</h2>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Report</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Write-up</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2">
                        <select value={row.department} onChange={e => handlePerformanceChange(idx, 'department', e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded text-sm uppercase bg-white">
                          <option value="">SELECT DEPARTMENT</option>
                          {departmentOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={row.employee} onChange={e => handlePerformanceChange(idx, 'employee', e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded text-sm uppercase bg-white" disabled={!row.department}>
                          <option value="">SELECT EMPLOYEE</option>
                          {getEmployeesByDepartment(row.department).map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={row.position} onChange={e => handlePerformanceChange(idx, 'position', e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded text-sm uppercase text-center bg-white" placeholder="POSITION" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={row.report} onChange={e => handlePerformanceChange(idx, 'report', e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded text-sm uppercase text-center bg-white" placeholder="REPORT" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input type="checkbox" checked={row.note} onChange={e => handlePerformanceChange(idx, 'note', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleRemovePerformanceRow(idx)} className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button onClick={handleAddPerformanceRow} className="bg-gray-900 text-white px-6 py-2 rounded font-semibold hover:bg-black transition text-sm shadow-md">+ Add Performance Report</button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-6 mt-6">
            <h2 className="text-lg font-bold text-black mb-2 uppercase">EVENT SUMMARY</h2>
            <textarea className="w-full min-h-[80px] border border-gray-300 rounded p-3 text-base bg-gray-50 resize-none overflow-hidden" placeholder="Write a summary of the event..." value={eventSummary} onChange={e => {
              setEventSummary(e.target.value);
              const ta = e.target;
              ta.style.height = 'auto';
              ta.style.height = ta.scrollHeight + 'px';
            }} style={{height: 'auto', maxHeight: '600px'}} rows={3} />
          </div>
          <div className="flex justify-center mt-8">
            <button onClick={handleSubmitClick} className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-10 rounded shadow-md text-lg transition tracking-wider">SUBMIT REPORT</button>
          </div>
          {showSecurityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="border border-black rounded-xl w-full max-w-xs mx-2 p-0 bg-white">
                <div className="flex flex-col items-center pt-6 pb-1 px-4">
                  <h2 className="text-2xl font-black tracking-widest text-black mb-1 text-center" style={{letterSpacing:'0.18em'}}>KLIMROD CFO</h2>
                  <span className="text-xs text-gray-400 font-semibold mb-2 tracking-widest text-center">SECURITY CODE</span>
                </div>
                <form onSubmit={e => { e.preventDefault(); handleSecuritySubmit(); }} className="flex flex-col items-center px-4 pb-6">
                  <div className="w-full mb-6 flex justify-center">
                    <div className="flex gap-4 relative">
                      {[0,1,2,3,4].map(i => (
                        <span key={i} className="inline-block w-8 h-12 border-b-2 border-black text-3xl font-light text-center align-middle transition-colors duration-150 select-none" style={{color: securityPassword.length > i ? '#111' : '#bbb', background:'transparent', lineHeight:'3rem'}}>{securityPassword.length > i ? '•' : '_'}</span>
                      ))}
                      <input
                        type="password"
                        value={securityPassword}
                        onChange={e => {
                          if (e.target.value.length <= 5) setSecurityPassword(e.target.value.replace(/[^0-9a-zA-Z]/g, ''));
                        }}
                        maxLength={5}
                        ref={securityInputRef}
                        autoFocus
                        aria-label="Security code input"
                        className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
                        style={{zIndex: 2}}
                        inputMode="text"
                        pattern="[0-9a-zA-Z]*"
                        tabIndex={0}
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 mt-1 bg-black text-white text-base font-bold rounded-full tracking-widest transition-all hover:bg-gray-900 focus:outline-none" style={{letterSpacing:'0.15em'}}>SUBMIT REPORT</button>
                  <button type="button" onClick={() => setShowSecurityModal(false)} className="w-full py-2 mt-2 bg-transparent text-black text-sm font-semibold rounded-full border border-black tracking-widest hover:bg-gray-100 transition-all focus:outline-none" style={{letterSpacing:'0.12em'}}>CANCEL</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
