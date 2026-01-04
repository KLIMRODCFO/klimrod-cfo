'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/authContext'
import { restaurants } from '@/app/lib/restaurants'

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedFI, setExpandedFI] = useState(false)
  const [expandedSales, setExpandedSales] = useState(false)
  const [expandedHR, setExpandedHR] = useState(false)
  const [activeRestaurant, setActiveRestaurant] = useState<string>('')
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    const updateActiveRestaurant = () => {
      const stored = localStorage.getItem('active_restaurant_id')
      if (stored) {
        const restaurant = restaurants.find(r => r.id === stored)
        if (restaurant) {
          setActiveRestaurant(restaurant.name)
        }
      } else {
        setActiveRestaurant('')
      }
    }

    // Load initially
    updateActiveRestaurant()

    // Listen for changes
    window.addEventListener('storage', updateActiveRestaurant)
    window.addEventListener('restaurant-changed', updateActiveRestaurant)

    return () => {
      window.removeEventListener('storage', updateActiveRestaurant)
      window.removeEventListener('restaurant-changed', updateActiveRestaurant)
    }
  }, [])

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <div className="w-48 bg-gray-900 text-white border-r-2 border-gray-800 h-screen flex flex-col">
      {/* Logo Area */}
      <div className="h-16 px-4 border-b-2 border-gray-800 flex items-center justify-center">
        <h2 className="text-lg font-bold text-white text-center">MENU</h2>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-0 overflow-y-auto">
        <Link
          href="/business-unit"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/business-unit')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          BUSINESS UNIT
        </Link>
        <Link
          href="/users"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/users')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          USERS
        </Link>
        <div className="border-b-2 border-gray-800">
          <button
            onClick={() => setExpandedHR(!expandedHR)}
            className={`w-full px-4 py-3 font-semibold text-sm transition text-left ${
              isActive('/hr')
                ? 'bg-gray-800 text-white'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>HR DEPARTMENT</span>
              <span className={`transition-transform ${expandedHR ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </button>
          {/* Submenu */}
          {expandedHR && (
            <div className="bg-gray-800">
              <Link
                href="/hr/application"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/application'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                QUICK ONBOARDING
              </Link>
              <Link
                href="/hr/hiring"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/hiring'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                HIRING PROCESS
              </Link>
              <Link
                href="/hr/timecard"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/timecard'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                TIME & ATTENDANCE
              </Link>
              <Link
                href="/hr/gratuity-report"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/gratuity-report'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                GRATUITY REPORT
              </Link>
              <Link
                href="/hr/payroll"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/payroll'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                PAYROLL SUMMARY
              </Link>
              <Link
                href="/hr/directory"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/hr/directory'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                STAFF DIRECTORY
              </Link>
            </div>
          )}
        </div>

        {/* Sales Report with expandable submenu */}
        <div className="border-b-2 border-gray-800">
          <button
            onClick={() => setExpandedSales(!expandedSales)}
            className={`w-full px-4 py-3 font-semibold text-sm transition text-left ${
              isActive('/sales-report') || isActive('/closed-events')
                ? 'bg-gray-800 text-white'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>SALES REPORT</span>
              <span className={`transition-transform ${expandedSales ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </button>

          {/* Submenu */}
          {expandedSales && (
            <div className="bg-gray-800">
              <Link
                href="/sales-report"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/sales-report'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                NEW CLOSEOUT
              </Link>
              <Link
                href="/closed-events"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/closed-events'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                CLOSED EVENTS
              </Link>
              <Link
                href="/pos-reconciliation"
                className={`block px-6 py-2 font-semibold text-xs transition ${
                  pathname === '/pos-reconciliation'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                POS RECONCILIATION
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/menu"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/menu')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          MENU
        </Link>
        <Link
          href="/inventory"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/inventory')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          INVENTORY
        </Link>
        <Link
          href="/sommelier-management"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/sommelier-management')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          SOMMELIER MANAGEMENT
        </Link>

        {/* Financial Intelligence with expandable submenu */}
        <div className="border-b-2 border-gray-800">
          <button
            onClick={() => setExpandedFI(!expandedFI)}
            className={`w-full px-4 py-3 font-semibold text-sm transition text-left ${
              isActive('/financial-intelligence')
                ? 'bg-gray-800 text-white'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>FINANCIAL INTELLIGENCE</span>
              <span className={`transition-transform ${expandedFI ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </button>
          {/* Submenu */}
          {expandedFI && (
            <div className="bg-gray-800">
              <Link
                href="/financial-intelligence/revenue-management"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/revenue-management'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                REVENUE MANAGEMENT
              </Link>
              <Link
                href="/financial-intelligence/vendors"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/vendors'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                VENDORS
              </Link>
              <Link
                href="/financial-intelligence/invoice-allocation"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/invoice-allocation'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                INVOICE ALLOCATION
              </Link>
              <Link
                href="/financial-intelligence/invoice-directory"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/invoice-directory'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                INVOICE DIRECTORY
              </Link>
              <Link
                href="/financial-intelligence/financial-reports"
                className={`block px-6 py-2 border-b border-gray-700 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/financial-reports'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                FINANCIAL REPORTS
              </Link>
              <Link
                href="/financial-intelligence/tax"
                className={`block px-6 py-2 font-semibold text-xs transition ${
                  pathname === '/financial-intelligence/tax'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                TAX
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/chef-management"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/chef-management')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          CHEF MANAGEMENT
        </Link>



        <Link
          href="/business-settings"
          className={`block px-4 py-3 border-b-2 border-gray-800 font-semibold text-sm transition ${
            isActive('/business-settings')
              ? 'bg-gray-800 text-white'
              : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          BUSINESS SETTINGS
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t-2 border-gray-800">
        <button
          onClick={async () => {
            await logout()
            router.push('/auth/login')
          }}
          className="w-full mb-3 px-4 py-2 text-sm font-semibold text-red-200 border-2 border-red-400 rounded hover:bg-red-900 hover:text-white transition"
        >
          LOGOUT
        </button>
        <p className="text-xs text-gray-400 text-center">
          KLIMROD CFO{activeRestaurant && ` - ${activeRestaurant}`}
        </p>
      </div>
    </div>
  )
}
