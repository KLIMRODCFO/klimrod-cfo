'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Event, SalesRow } from '@/app/lib/types'
import SalesTable from '@/app/components/SalesTable'
import { calculateTotals } from '@/app/lib/excel'

export default function SalesReportContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get('eventId')

  const [event, setEvent] = useState<Event | null>(null)
  const [sales, setSales] = useState<SalesRow[]>([
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
  const [loading, setLoading] = useState(false)

  // Load event data
  useEffect(() => {
    if (eventId) {
      const storedEvents = localStorage.getItem('events')
      if (storedEvents) {
        const events: Event[] = JSON.parse(storedEvents)
        const foundEvent = events.find((e) => e.id === eventId)
        if (foundEvent) {
          setEvent(foundEvent)
          // Load sales for this event
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
        alert('Sales report saved successfully!')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving sales report')
    } finally {
      setLoading(false)
    }
  }


  const totals = calculateTotals(sales)

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Event Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select or create an event first.
          </p>
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
          <h1 className="text-4xl font-bold text-gray-900">Sales Report</h1>
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

        {/* Sales Table */}
        <div className="mb-8">
          <SalesTable
            sales={sales}
            onUpdate={updateRow}
            onAddRow={addRow}
            onDeleteRow={deleteRow}
            totals={totals}
            employees={[]}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
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
      </div>
    </div>
  )
}
