'use client'

import { useState, useEffect } from 'react'
import AuthenticatedLayout from '@/app/components/AuthenticatedLayout'
import { SalesRow, SalesTotals, ExpenseRow, ExpenseTotals } from '@/app/lib/types'
import SalesTable from '@/app/components/SalesTable'
import ExpenseTable from '@/app/components/ExpenseTable'
import TipReport from '@/app/components/TipReport'
import OtherFeeTable from '@/app/components/OtherFeeTable'
import { getTucciEmployeesForSales } from '@/app/lib/tucciBrigade'
import { exportEmployeeTipReport } from '@/app/lib/excel'
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
  const [salesData, setSalesData] = useState<SalesRow[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseRow[]>([])
  const [otherFeeData, setOtherFeeData] = useState<Array<{employee: string, position: string}>>([])
  const [distributionMethod, setDistributionMethod] = useState<'percentage' | 'equal'>('percentage')
  const [employees, setEmployees] = useState<Array<{id: string, name: string, position: string}>>([])
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [securityPassword, setSecurityPassword] = useState('')
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
    // Load TUCCI employees
    const tucciEmp = getTucciEmployeesForSales()
    setEmployees(tucciEmp)

    // Load active restaurant
    const updateActiveRestaurant = () => {
      const stored = localStorage.getItem('active_restaurant_id')
      if (stored) {
        const restaurant = restaurants.find(r => r.id === stored)
        if (restaurant) {
          setActiveRestaurant(restaurant.name)
        }
      }
    }
    updateActiveRestaurant()

    // Listen for changes
    window.addEventListener('restaurant-changed', updateActiveRestaurant)
    return () => {
      window.removeEventListener('restaurant-changed', updateActiveRestaurant)
    }
  }, [])

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
      ])
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
  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'otherFee') {
      setEventInfo(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setEventInfo(prev => ({ ...prev, [name]: value.toUpperCase?.() ?? value }))
    }
  }

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
    
    // Auto-fill position when employee is selected
    if (field === 'employee' && typeof value === 'string') {
      const emp = employees.find(e => e.name === value)
      if (emp) {
        updated[index] = { ...updated[index], position: emp.position }
      }
    }
    
    saveSalesData(updated)
  }


  const handleExportEmployeeReport = () => {
    const tipReport = generateTipReport(salesData, distributionMethod)
    exportEmployeeTipReport(eventInfo, tipReport.distribution, totals, salesData)
  }

  const handleSubmitClick = () => {
    if (!eventInfo.date || !eventInfo.eventName) {
      alert('Please fill in Date and Event Name before submitting')
      return
    }
    setShowSecurityModal(true)
    setSecurityPassword('')
  }

  const handleSecuritySubmit = async () => {
    if (securityPassword !== '12345') {
      alert('Incorrect password. Access denied.')
      setSecurityPassword('')
      return
    }

    setShowSecurityModal(false)
    setSecurityPassword('')

    try {
      console.log('🔄 Saving event to Supabase...')
      
      const activeRestaurantId = localStorage.getItem('active_restaurant_id') || 'default'
      const tipReport = generateTipReport(salesData, distributionMethod)
      
      // Verificar conexión a Supabase
      console.log('🔍 Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase.from('events').select('id').limit(1)
      if (testError) {
        console.error('⚠️ Supabase connection test failed:', testError)
        console.error('Error code:', testError.code)
        console.error('Error message:', testError.message)
        console.error('Error hint:', testError.hint)
        alert(`Database connection error: ${testError.message}\nCode: ${testError.code || 'unknown'}`)
        return
      }
      console.log('✅ Supabase connection OK, table exists')
      
      // Prepare data object
      const eventDataToInsert = {
          date: eventInfo.date,
          day: eventInfo.day,
          year: new Date(eventInfo.date).getFullYear(),
          event_name: eventInfo.eventName,
          shift: eventInfo.shift,
          manager: eventInfo.manager,
          // Sales totals
          total_net_sales: totals.totalNetSales,
          total_cash_sales: totals.totalCashSales,
          total_cc_sales: totals.totalCcSales,
          total_cc_gratuity: totals.totalCcGratuity,
          total_cash_gratuity: totals.totalCashGratuity,
          total_gratuity: totals.totalGratuity,
          total_points: totals.totalPoints,
          // Expense totals
          total_expenses: expenseTotals.totalExpenses,
          expense_cash: expenseTotals.totalCash,
          expense_check: expenseTotals.totalCheck,
          expense_business: expenseTotals.totalBusiness,
          expense_employee: expenseTotals.totalEmployee,
          expense_refunded: expenseTotals.totalRefunded,
          // Calculated fields
          house_cash: totals.totalCashSales - expenseTotals.totalCash,
          other_fee: eventInfo.otherFee,
          // Tip distribution (CRITICAL for payroll)
          tip_distribution: tipReport.distribution,
          // Metadata
          notes: eventInfo.notes,
          distribution_method: distributionMethod,
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: eventInfo.manager,
          restaurant_id: activeRestaurantId,
          user_id: '00000000-0000-0000-0000-000000000000'
      }

      console.log('📝 Data to insert:', JSON.stringify(eventDataToInsert, null, 2))

      // 1. Create Event in Supabase with ALL data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([eventDataToInsert])
        .select()
        .single()

      if (eventError) {
        console.error('❌ Error creating event:', eventError)
        console.error('Error code:', eventError.code)
        console.error('Error message:', eventError.message)
        console.error('Error hint:', eventError.hint)
        console.error('Error details:', eventError.details)
        console.error('Full error object:', JSON.stringify(eventError, null, 2))
        alert(`Error saving event: ${eventError.message || 'Unknown error'}\nCode: ${eventError.code || 'unknown'}\nCheck console for full details.`)
        return
      }

      console.log('✅ Event created:', eventData)
      const eventId = eventData.id

      // 2. Save Sales Reports with event context
      if (salesData.length > 0) {
        const salesToSave = salesData
          .filter(row => row.employee && row.employee.trim() !== '')
          .map(row => ({
            event_id: eventId,
            employee: row.employee,
            position: row.position,
            net_sales: row.netSales || 0,
            cash_sales: row.cashSales || 0,
            cc_sales: row.ccSales || 0,
            cc_gratuity: row.ccGratuity || 0,
            cash_gratuity: row.cashGratuity || 0,
            points: row.points || 0,
            // Event context for easy queries
            event_date: eventInfo.date,
            event_day: eventInfo.day,
            event_name: eventInfo.eventName,
            shift: eventInfo.shift,
            manager: eventInfo.manager,
            restaurant_id: activeRestaurantId,
            user_id: '00000000-0000-0000-0000-000000000000'
          }))

        if (salesToSave.length > 0) {
          const { error: salesError } = await supabase
            .from('sales_reports')
            .insert(salesToSave)

          if (salesError) {
            console.error('❌ Error saving sales:', salesError)
          } else {
            console.log('✅ Sales saved:', salesToSave.length, 'rows')
          }
        }
      }

      // 3. Save Expenses
      if (expenseData.length > 0) {
        const expensesToSave = expenseData
          .filter(row => row.expenseName && row.expenseName.trim() !== '')
          .map(row => ({
            event_id: eventId,
            expense_name: row.expenseName,
            amount: row.amount || 0,
            payment_method: row.paymentMethod,
            paid_by: row.paidBy,
            employee_name: row.employeeName,
            refunded: row.refunded || false,
            restaurant_id: activeRestaurantId,
            user_id: '00000000-0000-0000-0000-000000000000'
          }))

        if (expensesToSave.length > 0) {
          const { error: expensesError } = await supabase
            .from('expenses')
            .insert(expensesToSave)

          if (expensesError) {
            console.error('❌ Error saving expenses:', expensesError)
          } else {
            console.log('✅ Expenses saved:', expensesToSave.length, 'rows')
          }
        }
      }

      // 4. Save Other Fees
      if (otherFeeData.length > 0) {
        const feesToSave = otherFeeData
          .filter(row => row.employee && row.employee.trim() !== '')
          .map(row => ({
            event_id: eventId,
            employee: row.employee,
            position: row.position,
            restaurant_id: activeRestaurantId,
            user_id: '00000000-0000-0000-0000-000000000000'
          }))

        if (feesToSave.length > 0) {
          const { error: feesError } = await supabase
            .from('other_fees')
            .insert(feesToSave)

          if (feesError) {
            console.error('❌ Error saving other fees:', feesError)
          } else {
            console.log('✅ Other fees saved:', feesToSave.length, 'rows')
          }
        }
      }

      // 5. Save Tip Distributions (CRITICAL for payroll)
      if (tipReport.distribution && tipReport.distribution.length > 0) {
        const otherFeePerPerson = eventInfo.otherFee / (otherFeeData.filter(f => f.employee).length || 1)
        
        const distributionsToSave = tipReport.distribution.map((dist: any) => ({
          event_id: eventId,
          employee: dist.employee,
          position: dist.position,
          points: dist.points || 0,
          percentage: dist.percentage || 0,
          tip_amount: dist.tipAmount || 0,
          net_sales: dist.netSales || 0,
          cc_gratuity: dist.ccGratuity || 0,
          cash_gratuity: dist.cashGratuity || 0,
          other_fee_amount: otherFeeData.some(f => f.employee === dist.employee) ? otherFeePerPerson : 0,
          total_earned: (dist.tipAmount || 0) + (otherFeeData.some(f => f.employee === dist.employee) ? otherFeePerPerson : 0),
          restaurant_id: activeRestaurantId,
          user_id: '00000000-0000-0000-0000-000000000000'
        }))

        const { error: distError } = await supabase
          .from('tip_distributions')
          .insert(distributionsToSave)

        if (distError) {
          console.error('❌ Error saving tip distributions:', distError)
        } else {
          console.log('✅ Tip distributions saved:', distributionsToSave.length, 'employees')
        }
      }

      // 5. Also save to localStorage for closed_events page (backward compatibility)
      const reportId = `${eventInfo.date}_${eventInfo.eventName.replace(/\s/g, '_')}_${Date.now()}`
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
        distributionMethod: distributionMethod,
        supabaseEventId: eventId
      }

      const existingEvents = localStorage.getItem('closed_events')
      const events = existingEvents ? JSON.parse(existingEvents) : []
      events.push(closedEvent)
      localStorage.setItem('closed_events', JSON.stringify(events))

      alert(`Event "${eventInfo.eventName}" has been closed and saved successfully!\n\nSaved to Supabase ✅`)
      
      // Clear all data for new report
      localStorage.removeItem('sales_default')
      localStorage.removeItem('expense_default')
      localStorage.removeItem('other_fee_data')
      localStorage.removeItem('sales_event_info')
      
      // Reload page to start fresh
      window.location.reload()

    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('Error saving event. Please check the console.')
    }
  }

  const handleCancelSecurity = () => {
    setShowSecurityModal(false)
    setSecurityPassword('')
  }

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
      <div className="w-full">
        <div className="flex justify-between items-center mb-2 px-6">
          <div>
            <h1 className="text-3xl font-bold text-black">SALES REPORT</h1>
            {activeRestaurant && (
              <p className="text-lg font-semibold text-gray-600 mt-1">{activeRestaurant}</p>
            )}
          </div>
          <button 
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-gray-900 text-white border-2 border-gray-800 rounded font-semibold text-sm hover:bg-gray-800 transition"
          >
            EXPORT TO EXCEL
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              GENERAL INFORMATION
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Event Information Table */}
              <table className="w-full text-sm border-2 border-gray-800 rounded overflow-hidden">
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">RESTAURANT</td>
                    <td className="px-4 py-2 text-gray-900 bg-white font-bold">
                      {activeRestaurant || 'NO RESTAURANT SELECTED'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">DATE</td>
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <input
                        type="date"
                        name="date"
                        value={eventInfo.date}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded uppercase"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">DAY</td>
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <select
                        name="day"
                        value={eventInfo.day}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded uppercase"
                      >
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
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <select
                        name="eventName"
                        value={eventInfo.eventName}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded uppercase"
                      >
                        <option value="">SELECT EVENT</option>
                        {EVENT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">SHIFT</td>
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <select
                        name="shift"
                        value={eventInfo.shift}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded uppercase"
                      >
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
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <input
                        type="text"
                        name="manager"
                        value={eventInfo.manager}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded uppercase"
                        placeholder="MANAGER NAME"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">OTHER FEE</td>
                    <td className="px-4 py-2 text-gray-900 bg-white">
                      <input
                        type="number"
                        name="otherFee"
                        value={eventInfo.otherFee || ''}
                        onChange={handleEventChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Table */}
              <table className="w-full text-sm border-2 border-gray-800 rounded overflow-hidden">
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">NET SALES</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${totals.totalNetSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">CASH SALES</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${totals.totalCashSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">CASH EXPENSES</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${expenseTotals.totalCash.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-600 border-r border-gray-800">HOUSE CASH</td>
                    <td className="px-4 py-2 text-gray-900 bg-gray-100 text-right font-bold">
                      ${(totals.totalCashSales - expenseTotals.totalCash).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">CC SALES</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${totals.totalCcSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">CC GRATUITY</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${totals.totalCcGratuity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">CASH GRATUITY</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      ${totals.totalCashGratuity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-white bg-gray-900 border-r border-gray-800">TOTAL POINTS</td>
                    <td className="px-4 py-2 text-gray-900 bg-white text-right font-bold">
                      {totals.totalPoints.toLocaleString('en-US')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              SALES AND GRATUITY DETAILS
            </h2>
            <SalesTable
              sales={salesData}
              onUpdate={handleCellChange}
              onAddRow={handleAddRow}
              onDeleteRow={handleRemoveRow}
              totals={totals}
              employees={employees}
            />
          </div>

          {salesData.length > 0 && (
            <div className="bg-white rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">
                  GRATUITY DISTRIBUTION
                </h2>
                <button 
                  onClick={handleExportEmployeeReport}
                  className="px-4 py-2 bg-gray-900 text-white border-2 border-gray-800 rounded font-semibold text-sm hover:bg-gray-800 transition"
                >
                  EMPLOYEES REPORT EXPORT
                </button>
              </div>
              <div className="mb-4">
                <label className="text-sm font-semibold text-black mr-4">
                  DISTRIBUTION METHOD
                </label>
                <select
                  value={distributionMethod}
                  onChange={(e) => setDistributionMethod(e.target.value as 'percentage' | 'equal')}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="percentage">BY POINTS</option>
                  <option value="equal">EQUAL PARTS</option>
                </select>
              </div>
              <TipReport sales={salesData} distributionMethod={distributionMethod} />
            </div>
          )}

          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              OTHER FEE DISTRIBUTION
            </h2>
            <OtherFeeTable
              rows={otherFeeData}
              onUpdate={handleOtherFeeChange}
              onAddRow={handleAddOtherFee}
              onDeleteRow={handleRemoveOtherFee}
              totalFee={eventInfo.otherFee}
              employees={employees}
            />
          </div>

          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              EXPENSES
            </h2>
            <ExpenseTable
              expenses={expenseData}
              onUpdate={handleExpenseChange}
              onAddRow={handleAddExpense}
              onDeleteRow={handleRemoveExpense}
              totals={expenseTotals}
              employees={employees}
            />
          </div>

          <div className="bg-white rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              NOTES
            </h2>
            <textarea
              name="notes"
              value={eventInfo.notes}
              onChange={(e) => setEventInfo(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded text-sm min-h-[150px] uppercase"
              placeholder="MANAGER NOTES - ANY COMMENTS OR OBSERVATIONS ABOUT THE SERVICE..."
            />
          </div>

          <div className="flex justify-center py-6">
            <button 
              onClick={handleSubmitClick}
              className="px-8 py-3 bg-gray-900 text-white border-2 border-gray-800 rounded font-semibold text-sm hover:bg-gray-800 transition"
            >
              SUBMIT & CLOSE EVENT
            </button>
          </div>
        </div>

        {/* Security Modal */}
        {showSecurityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                KLIMROD CFO
              </h2>
              <h3 className="text-lg font-semibold text-center text-gray-700 mb-6">
                SECURITY STEP
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Enter manager password to close event
              </p>
              <input
                type="password"
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSecuritySubmit()
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-800 rounded text-center text-lg font-semibold mb-6 focus:outline-none focus:border-gray-900"
                placeholder="••••••"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSecurity}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 border-2 border-gray-300 rounded font-semibold text-sm hover:bg-gray-300 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSecuritySubmit}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white border-2 border-gray-800 rounded font-semibold text-sm hover:bg-gray-800 transition"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
