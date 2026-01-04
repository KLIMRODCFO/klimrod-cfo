'use client'

import AuthenticatedLayout from '@/app/components/AuthenticatedLayout'
import { useState, useEffect } from 'react'
import { restaurants } from '@/app/lib/restaurants'

type SommelierTab = 'vendors' | 'beverages' | 'orders'

export default function SommelierManagementPage() {
  const [active, setActive] = useState<SommelierTab>('vendors')
  const [restaurantName, setRestaurantName] = useState<string>('')

  useEffect(() => {
    const updateRestaurant = () => {
      const stored = localStorage.getItem('active_restaurant_id')
      if (stored) {
        const restaurant = restaurants.find(r => r.id === stored)
        if (restaurant) {
          setRestaurantName(restaurant.name)
        }
      }
    }
    updateRestaurant()
    window.addEventListener('restaurant-changed', updateRestaurant)
    return () => window.removeEventListener('restaurant-changed', updateRestaurant)
  }, [])

  const tabs = [
    { id: 'vendors', label: 'VENDORS' },
    { id: 'beverages', label: 'BEVERAGES' },
    { id: 'orders', label: 'ORDERS' }
  ]

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl">
        <div className="pt-6 pb-2">
          <h1 className="text-3xl font-bold text-black">SOMMELIER MANAGEMENT</h1>
          {restaurantName && (
            <div className="mt-1">
              <span className="text-lg font-semibold text-gray-600">{restaurantName}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id as SommelierTab)}
              className={`px-4 py-3 border-2 font-semibold text-sm transition rounded ${
                active === tab.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="text-center">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div>
          {active === 'vendors' && <VendorsSection />}
          {active === 'beverages' && <BeveragesSection />}
          {active === 'orders' && <OrdersSection />}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

function VendorsSection() {
  interface Vendor {
    id: string
    name: string
    contact: string
    phone: string
    email: string
    address: string
    category: string
    paymentTerms: string
    notes: string
  }

  const CATEGORIES = ['WINE DISTRIBUTOR', 'SPIRITS DISTRIBUTOR', 'BEER DISTRIBUTOR', 'ALL BEVERAGES', 'OTHER']
  const PAYMENT_TERMS = ['NET 30', 'NET 60', 'COD', 'PREPAID', 'CREDIT CARD']

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Vendor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: '', name: '' })
  const [form, setForm] = useState({
    name: '', contact: '', phone: '', email: '', address: '', 
    category: '', paymentTerms: 'NET 30', notes: ''
  })
  const [activeRestaurantId, setActiveRestaurantId] = useState<string>('')

  useEffect(() => {
    const restaurantId = localStorage.getItem('active_restaurant_id') || 'default'
    setActiveRestaurantId(restaurantId)
    const stored = localStorage.getItem(`beverage_vendors_${restaurantId}`)
    
    if (stored) {
      setVendors(JSON.parse(stored))
    } else {
      // Initialize with BinWise vendors
      const defaultVendors = [
        { id: '1', name: 'AIDIL', contact: 'CARLOS BRAUNE', phone: '917-592-8299', email: 'carlos.braune@aidilwines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '2', name: 'ANGELS SHARE', contact: 'FRED PRICE', phone: '917-232-8729', email: 'fredp@aswnorth.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '3', name: 'AP WINE', contact: 'NICK FERGUSON', phone: '617-851-1293', email: 'nick@apwineimports.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '4', name: 'BALTER', contact: '', phone: '', email: '', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '5', name: 'BANVILLE', contact: 'VINCENT SEUFERT', phone: '917-459-4494', email: 'vincent@banvillewine.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '6', name: 'BOWLER', contact: 'MATTHEW KRUEGER', phone: '917-558-6993', email: 'mkrueger@bowlerwine.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '7', name: 'COGNAC ONE', contact: 'JOSHUA LEPRE', phone: '724-570-9908', email: 'jlepre@cognac-one.com', address: '', category: 'SPIRITS DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '8', name: 'CONSIGNMENT', contact: '', phone: '', email: '', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '9', name: 'DE MAISON EAST', contact: 'ERIKKA ANDERSON', phone: '917-448-7424', email: 'erikka@demaisoneast.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '10', name: 'DELMOMICOS DONT ORDER', contact: '', phone: '', email: '', address: '', category: 'OTHER', paymentTerms: 'NET 30', notes: 'DO NOT ORDER FROM THIS VENDOR' },
        { id: '11', name: 'DUCLOT DONT USE', contact: '', phone: '', email: '', address: '', category: 'OTHER', paymentTerms: 'NET 30', notes: 'DO NOT USE THIS VENDOR' },
        { id: '12', name: 'DUCLOT LA VINICOLE USA', contact: 'JOE RACCO', phone: '773-726-7792', email: 'jcracco@duclot.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '13', name: 'EMP. VINTAGE', contact: 'ALISON BOYD', phone: '917-586-1444', email: 'aboyd@empiremerchants.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '14', name: 'EMPIRE MERCHANTS', contact: 'JASON FERRETI', phone: '415-690-9944', email: 'jferretti@empiremerchants.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '15', name: 'EMPIRE VINTAGE', contact: '', phone: '', email: '', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '16', name: 'EMPIRE WINE DIVISION-ALLYSON', contact: 'ALISON BOYD', phone: '917-586-1444', email: 'aboyd@empiremerchants.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '17', name: 'FIELD SELECTIONS', contact: 'JAKE HALPER', phone: '917-748-6276', email: 'jake@fieldblendselections.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '18', name: 'FLEET WINE MERCHANTS', contact: 'ELAN MOSS', phone: '215-534-6797', email: 'elanmossbachrach@gmail.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '19', name: 'FREDERICK WILDMAN', contact: 'THOMAS JUSTINO', phone: '646-322-3420', email: 't.justino@frederickwildman.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '20', name: 'GABRIELA', contact: 'ARNAUD LAGRAULET', phone: '913-263-8175', email: 'arnaud@gabriellawines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '21', name: 'GHOST DELMONICOS', contact: 'SERGIO (GHOST)', phone: '212-381-1237', email: 'sergio@theoriginaldelmonicos.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '22', name: 'GRAND CRU', contact: 'ROCKY GRAY', phone: '718-913-7501', email: 'rocky@grandcruselections.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '23', name: 'GRAPE2GLASS', contact: 'ADRIANA DASILVA', phone: '862-588-1915', email: 'adrianag2glass@gmail.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '24', name: 'HAUS ALPENZ & SOTOLON', contact: 'MARY HARREL', phone: '607-592-8240', email: 'maryh@alpenz.com', address: '', category: 'SPIRITS DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '25', name: 'INDEPENDENCE', contact: 'ANTOINE ANTOINE', phone: '347-439-9172', email: 'alecompte@iwsny.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '26', name: 'IPO', contact: 'MARIAROSA TARTAGLIONE', phone: '347-204-9627', email: 'mariarosa@ipowines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '27', name: "JAN D'AMORE", contact: "JAN D'AMORE", phone: '917-257-7994', email: 'jandamore@gmail.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '28', name: 'KERMIT LYNCH', contact: 'CORAL FERNANDEZ', phone: '973-476-3714', email: 'coral.fernandez@kermitlynch.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '29', name: 'M.S. WALKER', contact: 'LUIGI APREDA', phone: '908-400-5413', email: 'lapreda@mswalker.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '30', name: 'M.TOUTON', contact: 'DOMENICO BENTIVENGA', phone: '917-331-2778', email: 'domenico@mtouton.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '31', name: 'MANHATTAN BEER', contact: 'SPENCER SMITH', phone: '845-641-7223', email: 'ssmith@manhattanbeer.net', address: '', category: 'BEER DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '32', name: 'MASSANOIS', contact: 'JOE OPALKA', phone: '646-239-5639', email: 'jopalka@massanois.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '33', name: 'OMNIWINES', contact: '', phone: '', email: '', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '34', name: 'OPICI FAMILY', contact: 'RACHEL ALCATRAZ', phone: '865-385-4880', email: 'rachel.alcarraz@rndc-usa.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '35', name: 'PANEBIANCO', contact: 'RYAN BOWKER', phone: '917-701-6731', email: 'ryan.bowker@panebiancowines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '36', name: 'POLANER', contact: 'RICHARD ANDERSON', phone: '718-207-1278', email: 'randerson@polanerselections.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '37', name: 'ROSENTHAL', contact: 'TOBIAS ROWER', phone: '917-455-3858', email: 'tobias@rosenthalwinemerchant.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '38', name: 'SKI BEER SODA', contact: 'LUCAS LUCAS', phone: '646-261-4392', email: 'rt96@skibeersales.com', address: '', category: 'BEER DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '39', name: 'SKURNIK', contact: 'VIVIEN PEARCE', phone: '716-566-8549', email: 'vpearce@skurnik.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '40', name: 'SOILAIR SELECTION', contact: 'RUFIO LERMA', phone: '505-350-3896', email: 'rufio@soilairselection.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '41', name: "SOUTHERN GLAZER'S NY", contact: 'JASON PAPADOPOULOS', phone: '917-734-7483', email: 'jasonpapadopoulos@sgws.com', address: '', category: 'ALL BEVERAGES', paymentTerms: 'NET 30', notes: '' },
        { id: '42', name: 'SPAIN WINE C.', contact: 'JUAN CARLOS', phone: '914-906-6689', email: 'carlos@spainwinecollection.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '43', name: 'T. EDWARDS', contact: 'JEN SIN', phone: '703-447-9583', email: 'jsin@tedwardwines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '44', name: 'UNION BEER DISTRIBUTORS', contact: 'DENNIS CONDON', phone: '347-415-6818', email: 'dennis.condon@unionbeerdist.com', address: '', category: 'BEER DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '45', name: 'VIAS', contact: 'DONATO LESO', phone: '516-840-2991', email: 'ddeieso@viaswine.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '46', name: 'VIGNAIOLI SELECTION', contact: 'ADAM TANTAWI', phone: '201-983-1493', email: 'adam@vignaioliamerica.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '47', name: 'VINEYARD BRANDS', contact: 'REMY ASH', phone: '917-847-8779', email: 'rash@vineyardbrands.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '48', name: 'VINIFERA IMPORTS', contact: 'VINCE ATTARD', phone: '646-729-8544', email: 'viniferanyc@gmail.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '49', name: 'VINTUS NEW YORK', contact: 'BRIAN LONG', phone: '917-558-6017', email: 'blong@vintusny.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '50', name: 'WILSON DANIELS', contact: 'ASHER CHONG', phone: '917-868-5171', email: 'asherchong@wilsondaniels.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '51', name: 'WINE SOURCE', contact: 'ERIK WEYDERT', phone: '929-385-6394', email: 'erik@wine-source.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '52', name: 'WINEBOW', contact: 'JUSTIN BATE', phone: '646-319-8252', email: 'justin.bates@winebow.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' },
        { id: '53', name: 'ZRS WINES', contact: 'KRESO KRESO', phone: '347-346-1689', email: 'kreso@zrswines.com', address: '', category: 'WINE DISTRIBUTOR', paymentTerms: 'NET 30', notes: '' }
      ]
      setVendors(defaultVendors)
      localStorage.setItem(`beverage_vendors_${restaurantId}`, JSON.stringify(defaultVendors))
    }
  }, [])

  const handleAdd = () => {
    if (!form.name || !form.category) return
    const newVendor = { id: Date.now().toString(), ...form }
    const updated = [...vendors, newVendor]
    setVendors(updated)
    localStorage.setItem(`beverage_vendors_${activeRestaurantId}`, JSON.stringify(updated))
    setForm({ name: '', contact: '', phone: '', email: '', address: '', category: '', paymentTerms: 'NET 30', notes: '' })
    setShowForm(false)
  }

  const handleStartEdit = (vendor: Vendor) => {
    setEditingId(vendor.id)
    setEditForm({ ...vendor })
  }

  const handleSaveEdit = () => {
    if (!editForm) return
    const updated = vendors.map(v => v.id === editingId ? editForm : v)
    setVendors(updated)
    localStorage.setItem(`beverage_vendors_${activeRestaurantId}`, JSON.stringify(updated))
    setEditingId(null)
    setEditForm(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDelete = (id: string) => {
    const vendor = vendors.find(v => v.id === id)
    if (!vendor) return
    setDeleteConfirm({ show: true, id: vendor.id, name: vendor.name })
  }

  const confirmDelete = () => {
    const updated = vendors.filter(v => v.id !== deleteConfirm.id)
    setVendors(updated)
    localStorage.setItem(`beverage_vendors_${activeRestaurantId}`, JSON.stringify(updated))
    setDeleteConfirm({ show: false, id: '', name: '' })
  }

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-red-600">
            <h3 className="text-xl font-bold mb-4 uppercase text-red-600">Confirm Delete</h3>
            <p className="mb-2 text-gray-700">Are you sure you want to delete this vendor?</p>
            <p className="mb-6 font-bold text-lg">{deleteConfirm.name}</p>
            <p className="mb-6 text-sm text-gray-600 italic">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                className="flex-1 px-6 py-3 bg-gray-500 text-white rounded font-semibold uppercase hover:bg-gray-600"
              >
                NO
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded font-semibold uppercase hover:bg-red-700"
              >
                YES, DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 uppercase">Beverage Vendors Directory</h2>

      {/* Search and Add */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="SEARCH VENDOR..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-2 border-gray-900 px-4 py-2 rounded uppercase"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-gray-900 text-white rounded font-semibold uppercase hover:bg-gray-800"
        >
          {showForm ? 'CANCEL' : '+ ADD NEW VENDOR'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-50 border-2 border-gray-900 rounded p-4 mb-4">
          <h3 className="font-bold mb-3 uppercase">New Vendor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="VENDOR NAME"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
            <input
              placeholder="CONTACT PERSON"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
            <input
              placeholder="PHONE NUMBER"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <input
              type="email"
              placeholder="EMAIL"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <input
              placeholder="ADDRESS"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase md:col-span-2"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              <option value="">SELECT CATEGORY</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              {PAYMENT_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
            <textarea
              placeholder="NOTES (OPTIONAL)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase md:col-span-2"
              rows={2}
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 w-full bg-gray-900 text-white py-2 rounded font-semibold uppercase hover:bg-gray-800"
          >
            SAVE VENDOR
          </button>
        </div>
      )}

      {/* Vendors Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-gray-900">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Vendor Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Payment Terms</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 uppercase">
                  No vendors found. Add your first vendor.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                editingId === vendor.id && editForm ? (
                  <tr key={vendor.id} className="border-b border-gray-200 bg-blue-50">
                    <td className="px-2 py-2">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm uppercase"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editForm.contact}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value.toUpperCase() })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm uppercase"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value.toLowerCase() })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={editForm.paymentTerms}
                        onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-900 rounded text-sm"
                      >
                        {PAYMENT_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 uppercase mr-1"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 uppercase"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={vendor.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm">{vendor.contact}</td>
                    <td className="px-4 py-3 text-sm">{vendor.phone}</td>
                    <td className="px-4 py-3 text-sm">{vendor.email}</td>
                    <td className="px-4 py-3 text-sm">{vendor.category}</td>
                    <td className="px-4 py-3 text-sm">{vendor.paymentTerms}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleStartEdit(vendor)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 uppercase mr-1"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 uppercase"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 uppercase">
        Total: <span className="font-bold text-gray-900">{filteredVendors.length}</span> vendors
      </div>
    </div>
  )
}

function BeveragesSection() {
  interface Beverage {
    id: string
    name: string
    brand: string
    category: string
    type: string
    size: string
    abv: string
    cost: number
    price: number
    quantity: number
    vendor: string
    sku: string
  }

  const CATEGORIES = ['WINE', 'SPIRITS', 'BEER', 'CIDER', 'SAKE', 'LIQUEUR', 'VERMOUTH', 'OTHER']
  const WINE_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED']
  const SPIRITS_TYPES = ['VODKA', 'GIN', 'RUM', 'TEQUILA', 'WHISKEY', 'BOURBON', 'SCOTCH', 'BRANDY', 'COGNAC', 'MEZCAL', 'OTHER']
  const BEER_TYPES = ['LAGER', 'ALE', 'IPA', 'STOUT', 'PORTER', 'PILSNER', 'WHEAT', 'SOUR', 'OTHER']
  const SIZES = ['50ML', '375ML', '500ML', '750ML', '1L', '1.5L', '330ML CAN', '440ML CAN', 'KEG', 'OTHER']

  const [beverages, setBeverages] = useState<Beverage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: '', name: '' })
  const [form, setForm] = useState({
    name: '', brand: '', category: '', type: '', size: '', abv: '', 
    cost: 0, price: 0, quantity: 0, vendor: '', sku: ''
  })
  const [activeRestaurantId, setActiveRestaurantId] = useState<string>('')
  const [vendors, setVendors] = useState<string[]>([])

  useEffect(() => {
    const restaurantId = localStorage.getItem('active_restaurant_id') || 'default'
    setActiveRestaurantId(restaurantId)
    const stored = localStorage.getItem(`beverages_${restaurantId}`)
    if (stored) setBeverages(JSON.parse(stored))
    
    // Load vendors
    const vendorsStored = localStorage.getItem(`beverage_vendors_${restaurantId}`)
    if (vendorsStored) {
      const vendorsList = JSON.parse(vendorsStored)
      setVendors(vendorsList.map((v: any) => v.name))
    }
  }, [])

  const handleAdd = () => {
    if (!form.name || !form.category) return
    const newBeverage = { id: Date.now().toString(), ...form }
    const updated = [...beverages, newBeverage]
    setBeverages(updated)
    localStorage.setItem(`beverages_${activeRestaurantId}`, JSON.stringify(updated))
    setForm({ 
      name: '', brand: '', category: '', type: '', size: '', abv: '', 
      cost: 0, price: 0, quantity: 0, vendor: '', sku: '' 
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const beverage = beverages.find(b => b.id === id)
    if (!beverage) return
    setDeleteConfirm({ show: true, id: beverage.id, name: beverage.name })
  }

  const confirmDelete = () => {
    const updated = beverages.filter(b => b.id !== deleteConfirm.id)
    setBeverages(updated)
    localStorage.setItem(`beverages_${activeRestaurantId}`, JSON.stringify(updated))
    setDeleteConfirm({ show: false, id: '', name: '' })
  }

  const filteredBeverages = beverages.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'ALL' || b.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getTypeOptions = () => {
    switch (form.category) {
      case 'WINE': return WINE_TYPES
      case 'SPIRITS': return SPIRITS_TYPES
      case 'BEER': return BEER_TYPES
      default: return []
    }
  }

  const totalValue = beverages.reduce((sum, b) => sum + (b.cost * b.quantity), 0)
  const totalBottles = beverages.reduce((sum, b) => sum + b.quantity, 0)

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-red-600">
            <h3 className="text-xl font-bold mb-4 uppercase text-red-600">Confirm Delete</h3>
            <p className="mb-2 text-gray-700">Are you sure you want to delete this beverage?</p>
            <p className="mb-6 font-bold text-lg">{deleteConfirm.name}</p>
            <p className="mb-6 text-sm text-gray-600 italic">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                className="flex-1 px-6 py-3 bg-gray-500 text-white rounded font-semibold uppercase hover:bg-gray-600"
              >
                NO
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded font-semibold uppercase hover:bg-red-700"
              >
                YES, DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 uppercase">Beverages Inventory</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-4 border-2 border-gray-900 rounded bg-white">
          <p className="text-xs font-semibold uppercase text-gray-600">Total Units</p>
          <p className="text-2xl font-bold text-gray-900">{totalBottles}</p>
        </div>
        <div className="p-4 border-2 border-gray-900 rounded bg-white">
          <p className="text-xs font-semibold uppercase text-gray-600">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900">{beverages.length}</p>
        </div>
        <div className="p-4 border-2 border-gray-900 rounded bg-white">
          <p className="text-xs font-semibold uppercase text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
        </div>
        <div className="p-4 border-2 border-gray-900 rounded bg-white">
          <p className="text-xs font-semibold uppercase text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{new Set(beverages.map(b => b.category)).size}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="SEARCH BEVERAGE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-2 border-gray-900 px-4 py-2 rounded uppercase"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border-2 border-gray-900 px-4 py-2 rounded uppercase font-semibold"
        >
          <option value="ALL">ALL CATEGORIES</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-gray-900 text-white rounded font-semibold uppercase hover:bg-gray-800"
        >
          {showForm ? 'CANCEL' : '+ ADD BEVERAGE'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-50 border-2 border-gray-900 rounded p-4 mb-4">
          <h3 className="font-bold mb-3 uppercase">New Alcoholic Beverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="BEVERAGE NAME"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
            <input
              placeholder="BRAND"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, type: '' })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              <option value="">SELECT CATEGORY</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {form.category && getTypeOptions().length > 0 && (
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
              >
                <option value="">SELECT TYPE</option>
                {getTypeOptions().map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            )}
            <select
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              <option value="">SELECT SIZE</option>
              {SIZES.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <input
              placeholder="ABV % (e.g., 40)"
              value={form.abv}
              onChange={(e) => setForm({ ...form, abv: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="COST PER UNIT"
              value={form.cost || ''}
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
              step="0.01"
            />
            <input
              type="number"
              placeholder="SELLING PRICE"
              value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
              step="0.01"
            />
            <input
              type="number"
              placeholder="QUANTITY"
              value={form.quantity || ''}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <select
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              <option value="">SELECT VENDOR</option>
              {vendors.map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
            </select>
            <input
              placeholder="SKU (OPTIONAL)"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 w-full bg-gray-900 text-white py-2 rounded font-semibold uppercase hover:bg-gray-800"
          >
            SAVE BEVERAGE
          </button>
        </div>
      )}

      {/* Beverages Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-gray-900">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ABV</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Vendor</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBeverages.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500 uppercase">
                  No beverages found. Add your first beverage.
                </td>
              </tr>
            ) : (
              filteredBeverages.map((beverage) => (
                <tr key={beverage.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold">{beverage.name}</td>
                  <td className="px-4 py-3 text-sm">{beverage.brand}</td>
                  <td className="px-4 py-3 text-sm">{beverage.category}</td>
                  <td className="px-4 py-3 text-sm">{beverage.type || '-'}</td>
                  <td className="px-4 py-3 text-sm">{beverage.size}</td>
                  <td className="px-4 py-3 text-sm">{beverage.abv}%</td>
                  <td className="px-4 py-3 text-sm text-right">${beverage.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">${beverage.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{beverage.quantity}</td>
                  <td className="px-4 py-3 text-sm">{beverage.vendor || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(beverage.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 uppercase"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 uppercase">
        Total: <span className="font-bold text-gray-900">{filteredBeverages.length}</span> beverages
      </div>
    </div>
  )
}

function OrdersSection() {
  interface Order {
    id: string
    orderNumber: string
    date: string
    vendor: string
    status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
    items: number
    totalCost: number
    notes: string
  }

  const STATUSES = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']

  const [orders, setOrders] = useState<Order[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({ show: false, id: '', name: '' })
  const [form, setForm] = useState({
    orderNumber: '', date: '', vendor: '', status: 'PENDING' as Order['status'], 
    items: 0, totalCost: 0, notes: ''
  })
  const [activeRestaurantId, setActiveRestaurantId] = useState<string>('')

  useEffect(() => {
    const restaurantId = localStorage.getItem('active_restaurant_id') || 'default'
    setActiveRestaurantId(restaurantId)
    const stored = localStorage.getItem(`beverage_orders_${restaurantId}`)
    if (stored) setOrders(JSON.parse(stored))
    
    // Load vendors for dropdown
    const vendorsStored = localStorage.getItem(`beverage_vendors_${restaurantId}`)
    if (vendorsStored) setVendors(JSON.parse(vendorsStored))
  }, [])

  const handleAdd = () => {
    if (!form.orderNumber || !form.vendor || !form.date) return
    const newOrder = { id: Date.now().toString(), ...form }
    const updated = [...orders, newOrder]
    setOrders(updated)
    localStorage.setItem(`beverage_orders_${activeRestaurantId}`, JSON.stringify(updated))
    setForm({ orderNumber: '', date: '', vendor: '', status: 'PENDING', items: 0, totalCost: 0, notes: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    setDeleteConfirm({ show: true, id: order.id, name: order.orderNumber })
  }

  const confirmDelete = () => {
    const updated = orders.filter(o => o.id !== deleteConfirm.id)
    setOrders(updated)
    localStorage.setItem(`beverage_orders_${activeRestaurantId}`, JSON.stringify(updated))
    setDeleteConfirm({ show: false, id: '', name: '' })
  }

  const handleStatusChange = (id: string, newStatus: Order['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o)
    setOrders(updated)
    localStorage.setItem(`beverage_orders_${activeRestaurantId}`, JSON.stringify(updated))
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalPending = orders.filter(o => o.status === 'PENDING').length
  const totalOrdered = orders.filter(o => o.status === 'ORDERED').length
  const totalReceived = orders.filter(o => o.status === 'RECEIVED').length
  const totalValue = orders.reduce((sum, o) => sum + o.totalCost, 0)

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-800'
      case 'ORDERED': return 'bg-blue-100 text-blue-800 border-blue-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800 border-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-800'
    }
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-red-600">
            <h3 className="text-xl font-bold mb-4 uppercase text-red-600">Confirm Delete</h3>
            <p className="mb-2 text-gray-700">Are you sure you want to delete this order?</p>
            <p className="mb-6 font-bold text-lg">{deleteConfirm.name}</p>
            <p className="mb-6 text-sm text-gray-600 italic">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                className="flex-1 px-6 py-3 bg-gray-500 text-white rounded font-semibold uppercase hover:bg-gray-600"
              >
                NO
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded font-semibold uppercase hover:bg-red-700"
              >
                YES, DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 uppercase">Purchase Orders</h2>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="SEARCH ORDERS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-2 border-gray-900 px-4 py-2 rounded uppercase"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border-2 border-gray-900 px-4 py-2 rounded uppercase"
        >
          <option value="ALL">ALL STATUSES</option>
          {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-gray-900 text-white rounded font-semibold uppercase hover:bg-gray-800"
        >
          {showForm ? 'CANCEL' : '+ NEW ORDER'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-50 border-2 border-gray-900 rounded p-4 mb-4">
          <h3 className="font-bold mb-3 uppercase">New Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="ORDER NUMBER"
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <select
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              <option value="">SELECT VENDOR</option>
              {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Order['status'] })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase"
            >
              {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <input
              type="number"
              placeholder="NUMBER OF ITEMS"
              value={form.items || ''}
              onChange={(e) => setForm({ ...form, items: parseInt(e.target.value) || 0 })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="TOTAL COST"
              value={form.totalCost || ''}
              onChange={(e) => setForm({ ...form, totalCost: parseFloat(e.target.value) || 0 })}
              className="border-2 border-gray-900 px-3 py-2 rounded"
            />
            <textarea
              placeholder="NOTES"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value.toUpperCase() })}
              className="border-2 border-gray-900 px-3 py-2 rounded uppercase md:col-span-2"
              rows={2}
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 w-full bg-gray-900 text-white py-2 rounded font-semibold uppercase hover:bg-gray-800"
          >
            SAVE ORDER
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-gray-900">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Total Cost</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 uppercase">
                  No orders found. Create your first order.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm">{order.date}</td>
                  <td className="px-4 py-3 text-sm">{order.vendor}</td>
                  <td className="px-4 py-3 text-sm">{order.items}</td>
                  <td className="px-4 py-3 text-sm">${order.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`px-2 py-1 rounded border-2 text-xs font-semibold uppercase ${getStatusColor(order.status)}`}
                    >
                      {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 uppercase"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 uppercase">
        Total: <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
      </div>
    </div>
  )
}
