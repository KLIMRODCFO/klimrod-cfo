'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Event, SalesRow } from '@/app/lib/types'
import SalesTable from '@/app/components/SalesTable'
import TipReport from '@/app/components/TipReport'
import { calculateTotals, exportToExcel } from '@/app/lib/excel'

function EventDetailsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get('eventId')
  const tab = searchParams.get('tab') || 'sales'

  const [event, setEvent] = useState<Event | null>(null)
  const [sales, setSales] = useState<SalesRow[]>([])
  const [tipMethod, setTipMethod] = useState<'percentage' | 'equal'>('percentage')
  const [loading, setLoading] = useState(false)

  // Load event and sales data
  useEffect(() => {
    if (eventId) {
      const storedEvents = localStorage.getItem('events')
      if (storedEvents) {
        const events: Event[] = JSON.parse(storedEvents)
        const foundEvent = events.find((e) => e.id === eventId)
        if (foundEvent) {
          setEvent(foundEvent)
          const storedSales = localStorage.getItem(`sales_${eventId}`)
          if (storedSales) {
            setSales(JSON.parse(storedSales))
          }
        }
      }
    }
  }, [eventId])

  const updateRow = (index: number, field: keyof SalesRow, value: any) => {
    const updatedRows = [...sales]
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    }
    setSales(updatedRows)
  }

  const addRow = () => {
    setSales([
      ...sales,
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

  const deleteRow = (index: number) => {
    setSales(sales.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (eventId) {
        localStorage.setItem(`sales_${eventId}`, JSON.stringify(sales))
        alert('Reportes guardados exitosamente!')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error guardando reportes')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (event) {
      const totals = calculateTotals(sales)
      exportToExcel(event, sales, totals, [])
    }
  }

  const totals = calculateTotals(sales)

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Event Selected</h2>
          <a
            href="/events"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Events
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/events"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 block"
          >
            ← Back to Events
          </a>
          <h1 className="text-4xl font-bold text-gray-900">{event.eventName}</h1>
          <p className="text-gray-600 mt-2">{event.date} • {event.shift} • {event.manager}</p>
        </div>

        {/* Event Info Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">EVENT</p>
            <p className="text-lg font-bold text-gray-900">{event.eventName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">DATE</p>
            <p className="text-lg font-bold text-gray-900">{event.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">SHIFT</p>
            <p className="text-lg font-bold text-gray-900">{event.shift}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">MANAGER</p>
            <p className="text-lg font-bold text-gray-900">{event.manager}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => router.push(`?eventId=${eventId}&tab=sales`)}
            className={`pb-4 font-medium transition ${
              tab === 'sales'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Sales Report
          </button>
          <button
            onClick={() => router.push(`?eventId=${eventId}&tab=tips`)}
            className={`pb-4 font-medium transition ${
              tab === 'tips'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💰 Tip Distribution
          </button>
        </div>

        {/* Content */}
        {tab === 'sales' ? (
          <>
            <SalesTable
              sales={sales}
              onUpdate={updateRow}
              onAddRow={addRow}
              onDeleteRow={deleteRow}
              totals={totals}
            />
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Saving...' : 'Save Report'}
              </button>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                📥 Export to Excel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tip Distribution Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="percentage"
                    checked={tipMethod === 'percentage'}
                    onChange={(e) => setTipMethod(e.target.value as 'percentage' | 'equal')}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">By Sales Percentage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="equal"
                    checked={tipMethod === 'equal'}
                    onChange={(e) => setTipMethod(e.target.value as 'percentage' | 'equal')}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Equal Distribution</span>
                </label>
              </div>
            </div>
            <TipReport sales={sales} distributionMethod={tipMethod} />
          </>
        )}
      </div>
    </div>
  )
}

export default EventDetailsContent
