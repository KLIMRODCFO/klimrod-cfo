
'use client'

import { useState, useEffect } from 'react'
import AuthenticatedLayout from '@/app/components/AuthenticatedLayout'
import KlimrodLogo from '@/app/components/KlimrodLogo'
import { restaurants } from '@/app/lib/restaurants'

export default function POSReconciliationPage() {
	const [activeRestaurant, setActiveRestaurant] = useState<string>('')

	useEffect(() => {
		const stored = localStorage.getItem('active_restaurant_id')
		if (stored) {
			const restaurant = restaurants.find(r => r.id === stored)
			if (restaurant) {
				setActiveRestaurant(restaurant.name)
			}
		}
		const handler = () => {
			const stored = localStorage.getItem('active_restaurant_id')
			if (stored) {
				const restaurant = restaurants.find(r => r.id === stored)
				if (restaurant) {
					setActiveRestaurant(restaurant.name)
				}
			}
		}
		window.addEventListener('restaurant-changed', handler)
		return () => window.removeEventListener('restaurant-changed', handler)
	}, [])

	return (
		<AuthenticatedLayout>
			<div className="flex flex-col items-start gap-1 px-2 pt-2">
				<h1 className="text-2xl font-extrabold tracking-wide text-black ml-2">POS RECONCILIATION</h1>
				{activeRestaurant && (
					<div>
						<span className="text-lg font-semibold text-gray-600 ml-2">{activeRestaurant}</span>
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	)
}
