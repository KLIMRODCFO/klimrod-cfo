"use client"

import { useEffect, useMemo, useState } from 'react'
import AuthenticatedLayout from '@/app/components/AuthenticatedLayout'
import { restaurants } from '@/app/lib/restaurants'

interface AppUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'chef' | 'finance' | 'hr'
  restaurantId: string
  status: 'active' | 'inactive'
  permissions: string
}

const defaultUsers: AppUser[] = [
  {
    id: 'USR1',
    name: 'Admin Global',
    email: 'admin@klimrod.com',
    role: 'admin',
    restaurantId: 'REST1',
    status: 'active',
    permissions: 'Full access to all modules and restaurants.'
  },
  {
    id: 'USR2',
    name: 'Chef Tucci',
    email: 'chef.tucci@klimrod.com',
    role: 'chef',
    restaurantId: 'REST1',
    status: 'active',
    permissions: 'Can edit recipes, place kitchen orders, and view kitchen payroll only.'
  },
  {
    id: 'USR3',
    name: 'Manager Harbor',
    email: 'manager.harbor@klimrod.com',
    role: 'manager',
    restaurantId: 'REST4',
    status: 'active',
    permissions: 'Can submit sales reports and view basic analytics for assigned unit.'
  }
]

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>(defaultUsers)
  const [filterRestaurant, setFilterRestaurant] = useState<string>('all')
  const [form, setForm] = useState<Omit<AppUser, 'id'>>({
    name: '',
    email: '',
    role: 'manager',
    restaurantId: restaurants[0]?.id || '',
    status: 'active',
    permissions: ''
  })

  useEffect(() => {
    const stored = localStorage.getItem('users')
    if (stored) setUsers(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users))
  }, [users])

  const filtered = useMemo(() => {
    if (filterRestaurant === 'all') return users
    return users.filter(u => u.restaurantId === filterRestaurant)
  }, [users, filterRestaurant])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const addUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.restaurantId) return
    const newUser: AppUser = {
      id: 'USR' + (Date.now() % 100000),
      ...form
    }
    setUsers(prev => [...prev, newUser])
    setForm({
      name: '',
      email: '',
      role: 'manager',
      restaurantId: restaurants[0]?.id || '',
      status: 'active',
      permissions: ''
    })
  }

  // Get active restaurant name (same logic as other pages)
  const [activeRestaurant, setActiveRestaurant] = useState<string>("");
  useEffect(() => {
    const stored = localStorage.getItem('active_restaurant_id');
    if (stored) {
      const restaurant = restaurants.find(r => r.id === stored);
      if (restaurant) setActiveRestaurant(restaurant.name);
    }
    window.addEventListener('restaurant-changed', () => {
      const stored = localStorage.getItem('active_restaurant_id');
      if (stored) {
        const restaurant = restaurants.find(r => r.id === stored);
        if (restaurant) setActiveRestaurant(restaurant.name);
      }
    });
    return () => {
      window.removeEventListener('restaurant-changed', () => {});
    };
  }, []);
  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl">
        <div className="pt-6 pb-2">
          <h1 className="text-3xl font-bold text-black">USERS</h1>
          {activeRestaurant && (
            <div className="mt-1">
              <span className="text-lg font-semibold text-gray-600">{activeRestaurant}</span>
            </div>
          )}
        </div>
        <p className="text-gray-700 mb-6">Control centralizado de accesos por restaurante y rol. Solo un admin puede ver y gestionar esta sección.</p>

        <div className="bg-white border-2 border-black rounded p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add User</h2>
          <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="chef">Chef</option>
                <option value="finance">Finance</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Restaurant</label>
              <select name="restaurantId" value={form.restaurantId} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Permissions (summary)</label>
              <textarea name="permissions" value={form.permissions} onChange={handleChange} className="w-full border px-3 py-2 rounded" rows={3} placeholder="Ej. Puede editar recetas y ver payroll de cocina." />
            </div>
            <div>
              <button type="submit" className="px-6 py-2 bg-blue-900 text-white font-semibold rounded hover:bg-blue-800">Guardar usuario</button>
            </div>
          </form>
        </div>

        <div className="bg-white border-2 border-black rounded p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Usuarios por restaurante</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Filtrar:</span>
              <select value={filterRestaurant} onChange={(e) => setFilterRestaurant(e.target.value)} className="border px-3 py-2 rounded">
                <option value="all">Todos</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="p-2">User</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Restaurant</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rest = restaurants.find(r => r.id === u.restaurantId)
                  return (
                    <tr key={u.id} className="border-b">
                      <td className="p-2 font-semibold">{u.name}</td>
                      <td className="p-2 text-blue-700">{u.email}</td>
                      <td className="p-2 uppercase">{u.role}</td>
                      <td className="p-2">{rest ? rest.name : u.restaurantId}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-2 text-gray-700 max-w-md">{u.permissions || '—'}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-gray-600" colSpan={6}>No users for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-600 mt-4">Nota: Los permisos detallados ayudan a mapear acciones futuras (por ejemplo, limitar chef a recetas y payroll de cocina).</p>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
