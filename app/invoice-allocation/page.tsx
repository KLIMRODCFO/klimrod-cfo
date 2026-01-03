"use client"

import { useState, useEffect } from 'react'
import MinimalDatePicker from '@/app/components/MinimalDatePicker'
import InvoiceScanner from '@/app/components/InvoiceScanner'

interface InvoiceItem {
  id: string
  product_service: string
  quantity: number
  rate: number
  amount: number
  category: string
  discrepancy?: string
}

interface Invoice {
  id: string
  vendor: string
  amount: number
  date: string
  due_date?: string
  bill_number?: string
  payment_terms?: string
  location?: string
  category: string
  items: InvoiceItem[]
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
  attachment_url?: string
  created_by?: string
  notes?: string
  tax?: number
  shipping?: number
  // Legacy fields for backward compatibility
  delivery_number?: string
  description?: string
}

export default function InvoiceAllocationPage() {
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form state - EDITABLE
  const [form, setForm] = useState({
    vendor: '',
    amount: 0,
    date: '',
    due_date: '',
    bill_number: '',
    terms: '',
    memo: '',
    tax: 0,
    shipping: 0,
    category: 'food'
  })
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const activeRestaurantId = localStorage.getItem('active_restaurant_id') || 'default'
    setRestaurantId(activeRestaurantId)
    
    const stored = localStorage.getItem(`invoices_${activeRestaurantId}`)
    if (stored) {
      setInvoices(JSON.parse(stored))
    }
  }, [])

  // Handle AI scan - AUTOCOMPLETE but EDITABLE
  const handleScan = (data: any) => {
    console.log('AI scan completed:', data)
    
    // Autocomplete form fields - Map old fields to new ones
    setForm({
      vendor: (data.vendor || form.vendor).toUpperCase(),
      amount: data.amount || form.amount,
      date: data.date || form.date,
      due_date: form.due_date,
      bill_number: (data.delivery_number || form.bill_number).toUpperCase(),
      terms: (data.payment_terms || form.terms).toUpperCase(),
      memo: (data.description || form.memo).toUpperCase(),
      tax: form.tax,
      shipping: form.shipping,
      category: form.category
    })
    
    // Autocomplete items with AI-suggested category
    if (data.items && data.items.length > 0) {
      const mappedItems = data.items.map((item: any) => {
        // AI suggests category based on product name
        const productName = (item.product_name || '').toUpperCase()
        let suggestedCategory = 'food' // default
        
        // Food-related keywords
        if (productName.match(/MEAT|FISH|CHICKEN|BEEF|PORK|LAMB|SEAFOOD|SALMON|TUNA|SHRIMP|LOBSTER|VEGETABLE|FRUIT|CHEESE|DAIRY|MILK|CREAM|BUTTER|EGG|BREAD|PASTA|RICE|FLOUR|OIL|SPICE|SALT|PEPPER|SUGAR|SAUCE|TOMATO|LETTUCE|ONION|GARLIC|POTATO|CARROT/)) {
          suggestedCategory = 'food'
        }
        // Beverage-related keywords
        else if (productName.match(/WINE|BEER|VODKA|WHISKEY|TEQUILA|RUM|GIN|CHAMPAGNE|PROSECCO|LIQUOR|SPIRIT|COCKTAIL|JUICE|SODA|WATER|COFFEE|TEA|SYRUP|MIXER|BOTTLE|KEG|DRAFT/)) {
          suggestedCategory = 'beverage'
        }
        // Cleaning
        else if (productName.match(/CLEAN|SOAP|DETERGENT|SANITIZER|BLEACH|DISINFECT|MOP|BROOM|SPONGE|TOWEL|GLOVE/)) {
          suggestedCategory = 'cleaning_expenses'
        }
        // Restaurant Materials & Supplies
        else if (productName.match(/PLATE|DISH|FORK|KNIFE|SPOON|NAPKIN|STRAW|CUP|GLASS|CONTAINER|BOX|BAG|WRAP|FOIL|PAPER|PLASTIC|DISPOSABLE|UTENSIL|GLOVE|APRON/)) {
          suggestedCategory = 'restaurant_materials_supplies'
        }
        // Office supplies
        else if (productName.match(/PEN|PENCIL|NOTEBOOK|STAPLER|TAPE|PRINTER|INK|TONER|ENVELOPE|FOLDER|FILE/)) {
          suggestedCategory = 'office_supplies'
        }
        // Repairs & Maintenance
        else if (productName.match(/REPAIR|FIX|MAINTENANCE|TOOL|HARDWARE|SCREW|NAIL|BOLT|WRENCH|DRILL|PAINT/)) {
          suggestedCategory = 'repairs_maintenance'
        }
        
        return {
          id: `item-${Date.now()}-${Math.random()}`,
          product_service: productName,
          quantity: (item.cases || 0) + (item.bottles || 0),
          rate: item.unit_price || 0,
          amount: item.total_price || 0,
          category: suggestedCategory,
          discrepancy: ''
        }
      })
      setItems(mappedItems)
    }
    
    setShowScanner(false)
    
    alert(`Invoice scanned successfully!\n\n${data.items?.length || 0} items detected\n\nPlease review and edit if needed`)
  }

  // Handle form changes - MANUAL EDITING
    // Adaptador para MinimalDatePicker
    const handleDatePickerChange = (e: { target: { value: string; name: string } }) => {
      setForm(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }))
    }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }))
  }

  // Handle item changes - MANUAL EDITING
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleAddItem = () => {
    setItems([...items, {
      id: `item-${Date.now()}`,
      product_service: '',
      quantity: 0,
      rate: 0,
      amount: 0,
      category: 'food',
      discrepancy: ''
    }])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate total from items
    const calculatedAmount = items.reduce((sum, item) => 
      sum + (item.amount || 0), 0
    )

    const newInvoice: Invoice = {
      id: editingInvoice?.id || `inv-${Date.now()}`,
      vendor: form.vendor,
      amount: calculatedAmount,
      date: form.date,
      due_date: form.due_date,
      bill_number: form.bill_number,
      payment_terms: form.terms,
      location: restaurantId,
      category: form.category,
      notes: form.memo,
      items,
      status: 'pending',
      created_at: editingInvoice?.created_at || new Date().toISOString(),
      created_by: 'Current User'
    }

    const updated = editingInvoice
      ? invoices.map(inv => inv.id === editingInvoice.id ? newInvoice : inv)
      : [...invoices, newInvoice]

    setInvoices(updated)
    localStorage.setItem(`invoices_${restaurantId}`, JSON.stringify(updated))

    // Reset
    resetForm()
    alert(`Invoice ${editingInvoice ? 'updated' : 'saved'} successfully!`)
  }

  const resetForm = () => {
    setForm({
      vendor: '',
      amount: 0,
      date: '',
      due_date: '',
      bill_number: '',
      terms: '',
      memo: '',
      tax: 0,
      shipping: 0,
      category: 'food'
    })
    setItems([])
    setEditingInvoice(null)
  }

  const handleEdit = (invoice: Invoice) => {
    setForm({
      vendor: invoice.vendor,
      amount: invoice.amount,
      date: invoice.date,
      due_date: invoice.due_date || '',
      bill_number: invoice.bill_number || '',
      terms: invoice.payment_terms || '',
      memo: invoice.notes || '',
      tax: invoice.tax || 0,
      shipping: invoice.shipping || 0,
      category: invoice.category
    })
    setItems(invoice.items)
    setEditingInvoice(invoice)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Delete this invoice?')) return
    
    const updated = invoices.filter(inv => inv.id !== id)
    setInvoices(updated)
    localStorage.setItem(`invoices_${restaurantId}`, JSON.stringify(updated))
  }

  const handleStatusChange = (id: string, status: Invoice['status']) => {
    const updated = invoices.map(inv => 
      inv.id === id ? { ...inv, status } : inv
    )
    setInvoices(updated)
    localStorage.setItem(`invoices_${restaurantId}`, JSON.stringify(updated))
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const statusMatch = filterStatus === 'all' || inv.status === filterStatus
    const categoryMatch = filterCategory === 'all' || inv.category === filterCategory
    const searchMatch = searchQuery === '' || 
      inv.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.bill_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.delivery_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusMatch && categoryMatch && searchMatch
  })

  // Calculate summary
  const summary = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    byCategory: {
      food: invoices.filter(i => i.category === 'food').reduce((sum, i) => sum + i.amount, 0),
      beverage: invoices.filter(i => i.category === 'beverage').reduce((sum, i) => sum + i.amount, 0),
      equipment: invoices.filter(i => i.category === 'equipment').reduce((sum, i) => sum + i.amount, 0),
      supplies: invoices.filter(i => i.category === 'other').reduce((sum, i) => sum + i.amount, 0)
    },
    byStatus: {
      pending: invoices.filter(i => i.status === 'pending').length,
      approved: invoices.filter(i => i.status === 'approved').length,
      paid: invoices.filter(i => i.status === 'paid').length
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status] || 'bg-gray-50 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-12 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Invoice Allocation
        </h1>
        <p className="text-sm text-gray-500">Expense Management & Tracking</p>
      </div>

      {/* AI SCANNER SECTION */}
      <div className="mb-8">
        {showScanner ? (
          <div className="border border-gray-200 rounded">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Invoice Scanner</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <InvoiceScanner onDataExtracted={handleScan} />
          </div>
        ) : !Object.values(form).some(v => v) && items.length === 0 ? (
          /* RECORD INVOICE - Entry Method Selection */
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Record Invoice</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {/* Manual Entry Option */}
              <button
                onClick={() => {
                  setItems([{
                    id: `item-${Date.now()}`,
                    product_service: '',
                    quantity: 0,
                    rate: 0,
                    amount: 0,
                    category: '',
                  }])
                }}
                className="border-2 border-gray-300 rounded-lg p-8 hover:border-black hover:bg-gray-900 hover:text-white hover:shadow-lg transition-all text-center group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✍️</div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-white mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-200">Enter invoice details manually</p>
              </button>

              {/* Scan Invoice Option */}
              <button
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded hover:bg-black transition-all text-center mt-6"
              >
                <div className="text-5xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload Invoice</h3>
                <p className="text-sm text-white">Upload image and auto-fill with AI</p>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* FORM - Two Column Layout like Sales Report */}
      {(showScanner || items.length > 0 || Object.values(form).some(v => v)) && (
        <form onSubmit={handleSubmit} className="mb-8">
          {/* GENERAL INFORMATION - Two Column Header */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black mb-4">GENERAL INFORMATION</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN - Dark Background with Form Fields */}
              <div className="bg-gray-900 text-white p-6 rounded">
                <div className="space-y-2">
                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Vendor</label>
                    <input
                      type="text"
                      name="vendor"
                      value={form.vendor}
                      onChange={handleChange}
                      required
                      className="px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Vendor name"
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Invoice Date</label>
                    <MinimalDatePicker
                      value={form.date}
                      name="date"
                      required
                      onChange={handleDatePickerChange}
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Due Date</label>
                    <MinimalDatePicker
                      value={form.due_date}
                      name="due_date"
                      onChange={handleDatePickerChange}
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Bill Number</label>
                    <input
                      type="text"
                      name="bill_number"
                      value={form.bill_number}
                      onChange={handleChange}
                      className="px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Bill number"
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Terms</label>
                    <input
                      type="text"
                      name="terms"
                      value={form.terms}
                      onChange={handleChange}
                      className="px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="NET 30, COD, etc."
                    />
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                    <label className="text-sm font-semibold uppercase">Memo</label>
                    <textarea
                      name="memo"
                      value={form.memo}
                      onChange={handleChange}
                      rows={2}
                      className="px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                      placeholder="Internal comments"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Dark Background with Calculated Totals */}
              <div className="bg-gray-900 text-white p-6 rounded">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Subtotal</label>
                    <div className="text-right text-lg font-bold">
                      ${items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      name="tax"
                      value={form.tax || ''}
                      onChange={handleChange}
                      className="w-28 px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center border-b border-gray-700 pb-2">
                    <label className="text-sm font-semibold uppercase">Shipping</label>
                    <input
                      type="number"
                      step="0.01"
                      name="shipping"
                      value={form.shipping || ''}
                      onChange={handleChange}
                      className="w-28 px-3 py-1.5 bg-white text-black border-0 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center bg-gray-800 p-3 rounded">
                    <label className="text-sm font-bold uppercase">Invoice Total</label>
                    <div className="text-right text-2xl font-bold">
                      ${(items.reduce((sum, item) => sum + (item.amount || 0), 0) + (parseFloat(form.tax as any) || 0) + (parseFloat(form.shipping as any) || 0)).toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center border-t border-gray-700 pt-2">
                    <label className="text-sm font-semibold uppercase">Total Items</label>
                    <div className="text-right text-lg font-bold">{items.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LINE ITEMS DETAILS */}
          <div>
            <h2 className="text-lg font-bold text-black mb-4">LINE ITEMS DETAILS</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Product/Service</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Rate</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Discrepancy</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                          No items. Click "Add Item" or scan invoice to add products.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-center text-sm text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.product_service}
                              onChange={(e) => handleItemChange(item.id, 'product_service', e.target.value)}
                              className="w-full min-w-[200px] px-3 py-2 border border-gray-300 rounded text-sm text-center bg-white focus:border-gray-900 focus:outline-none"
                              placeholder="Product or service description"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-center text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-900 focus:outline-none"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate || ''}
                              onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-center text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-900 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-center text-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-900 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center bg-white focus:border-gray-900 focus:outline-none"
                            >
                              <option value="food">FOOD</option>
                              <option value="beverage">BEVERAGE</option>
                              <option value="marketing">MARKETING</option>
                              <option value="merchant_account_fees">MERCHANT ACCOUNT FEES</option>
                              <option value="rent_lease">RENT & LEASE</option>
                              <option value="utilities">UTILITIES</option>
                              <option value="professional_services">PROFESSIONAL SERVICES</option>
                              <option value="music_talent">MUSIC & TALENT</option>
                              <option value="bank_service_charge">BANK SERVICE CHARGE</option>
                              <option value="cleaning_expenses">CLEANING EXPENSES</option>
                              <option value="apps_software">APPS & SOFTWARE</option>
                              <option value="payroll">PAYROLL</option>
                              <option value="repairs_maintenance">REPAIRS & MAINTENANCE</option>
                              <option value="restaurant_materials_supplies">RESTAURANT MATERIAL & SUPPLIES</option>
                              <option value="permits_licenses">PERMITS & LICENSES</option>
                              <option value="office_supplies">OFFICE SUPPLIES</option>
                              <option value="insurance">INSURANCE</option>
                              <option value="security">SECURITY</option>
                              <option value="charges_back">CHARGES BACK</option>
                              <option value="travel_meals">TRAVEL & MEALS</option>
                              <option value="fines_penalties">FINES & PENALTIES</option>
                              <option value="furniture_decoration">FURNITURE & DECORATION</option>
                              <option value="miscellaneous_expenses">MISCELLANEOUS EXPENSES</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.discrepancy || ''}
                              onChange={(e) => handleItemChange(item.id, 'discrepancy', e.target.value)}
                              className="w-full min-w-[150px] px-3 py-2 border border-gray-300 rounded text-sm text-center bg-white focus:border-gray-900 focus:outline-none"
                              placeholder="Missing items notes"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t border-gray-300">
                    <tr>
                      <td colSpan={8} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded hover:bg-black"
                        >
                          + Add Item
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            {editingInvoice && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-white border border-gray-300 text-sm font-semibold rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded hover:bg-black"
            >
              {editingInvoice ? 'Update' : 'Save'} Invoice
            </button>
          </div>
        </form>
      )}

      {/* SUMMARY */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-200 pb-3">
          Monthly Summary
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Food & Ingredients</span>
            <span className="text-sm font-semibold text-gray-900">${summary.byCategory.food.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Beverage & Bar</span>
            <span className="text-sm font-semibold text-gray-900">${summary.byCategory.beverage.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Equipment</span>
            <span className="text-sm font-semibold text-gray-900">${summary.byCategory.equipment.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Supplies & Other</span>
            <span className="text-sm font-semibold text-gray-900">${summary.byCategory.supplies.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-900 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 uppercase">Total</span>
              <span className="text-lg font-semibold text-gray-900">${summary.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Pending: {summary.byStatus.pending} | 
              Approved: {summary.byStatus.approved} | 
              Paid: {summary.byStatus.paid}
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border-2 border-black rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search vendor or bill #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 px-3 py-2 rounded text-sm focus:border-gray-900 focus:outline-none"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="food">FOOD</option>
            <option value="beverage">BEVERAGE</option>
            <option value="marketing">MARKETING</option>
            <option value="merchant_account_fees">MERCHANT ACCOUNT FEES</option>
            <option value="rent_lease">RENT & LEASE</option>
            <option value="utilities">UTILITIES</option>
            <option value="professional_services">PROFESSIONAL SERVICES</option>
            <option value="music_talent">MUSIC & TALENT</option>
            <option value="bank_service_charge">BANK SERVICE CHARGE</option>
            <option value="cleaning_expenses">CLEANING EXPENSES</option>
            <option value="apps_software">APPS & SOFTWARE</option>
            <option value="payroll">PAYROLL</option>
            <option value="repairs_maintenance">REPAIRS & MAINTENANCE</option>
            <option value="restaurant_materials_supplies">RESTAURANT MATERIAL & SUPPLIES</option>
            <option value="permits_licenses">PERMITS & LICENSES</option>
            <option value="office_supplies">OFFICE SUPPLIES</option>
            <option value="insurance">INSURANCE</option>
            <option value="security">SECURITY</option>
            <option value="charges_back">CHARGES BACK</option>
            <option value="travel_meals">TRAVEL & MEALS</option>
            <option value="fines_penalties">FINES & PENALTIES</option>
            <option value="furniture_decoration">FURNITURE & DECORATION</option>
            <option value="miscellaneous_expenses">MISCELLANEOUS EXPENSES</option>
          </select>
        </div>
      </div>

      {/* INVOICES LIST */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Invoices ({filteredInvoices.length})
        </h2>
        
        {filteredInvoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-12 text-center">
            <p className="text-gray-500 text-sm">No invoices found</p>
            <p className="text-gray-400 text-xs mt-2">Scan or add your first invoice to get started</p>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Invoice Header - Collapsible */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{expandedInvoice === invoice.id ? '▼' : '▶'}</span>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm text-gray-600">{invoice.date}</span>
                        <span className="text-sm font-semibold text-gray-900">{invoice.vendor}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {invoice.bill_number && (
                          <span>Bill #{invoice.bill_number}</span>
                        )}
                        {invoice.payment_terms && (
                          <span>• {invoice.payment_terms}</span>
                        )}
                        {invoice.location && (
                          <span>• {invoice.location}</span>
                        )}
                        {invoice.due_date && (
                          <span>• Due: {invoice.due_date}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-gray-900">${invoice.amount.toFixed(2)}</span>
                    <span className={`px-3 py-1 border rounded-full text-xs font-medium uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedInvoice === invoice.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Line Items Table */}
                  {invoice.items && invoice.items.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
                        Line Items ({invoice.items.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 bg-white">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="p-2 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                              <th className="p-2 text-left text-xs font-medium text-gray-700 uppercase">Product/Service</th>
                              <th className="p-2 text-center text-xs font-medium text-gray-700 uppercase">Quantity</th>
                              <th className="p-2 text-right text-xs font-medium text-gray-700 uppercase">Rate</th>
                              <th className="p-2 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                              <th className="p-2 text-center text-xs font-medium text-gray-700 uppercase">Category</th>
                              <th className="p-2 text-left text-xs font-medium text-gray-700 uppercase">Discrepancy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="p-2 text-xs text-gray-500">{idx + 1}</td>
                                <td className="p-2 text-sm text-gray-900">{item.product_service || item.product_name || '-'}</td>
                                <td className="p-2 text-center text-sm text-gray-900">{item.quantity || '-'}</td>
                                <td className="p-2 text-right text-sm text-gray-900">${(item.rate || 0).toFixed(2)}</td>
                                <td className="p-2 text-right text-sm font-medium text-gray-900">
                                  ${(item.amount || 0).toFixed(2)}
                                </td>
                                <td className="p-2 text-center text-xs text-gray-600">{item.category || '-'}</td>
                                <td className="p-2 text-xs text-red-600">{item.discrepancy || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                              <td colSpan={4} className="p-2 text-right text-xs font-semibold text-gray-700 uppercase">Total:</td>
                              <td className="p-2 text-right text-sm font-semibold text-gray-900" colSpan={3}>
                                ${invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700"><span className="font-semibold">Notes:</span> {invoice.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(invoice.id, 'approved')}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800"
                      >
                        Approve
                      </button>
                    )}
                    {invoice.status === 'approved' && (
                      <button
                        onClick={() => handleStatusChange(invoice.id, 'paid')}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800"
                      >
                        Mark as Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
