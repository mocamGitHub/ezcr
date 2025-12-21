'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import type { CustomerProfile, CRMActivity, CustomerNote, CustomerTask } from '@/types/crm'
import { getCustomerActivities, getCustomerNotes, getCustomerTasks, getCustomerOrders } from '@/actions/crm'
import { CustomerProfileCard } from './CustomerProfileCard'
import { ActivityTimeline } from './ActivityTimeline'
import { CustomerTasks } from './CustomerTasks'
import { CustomerOrders } from './CustomerOrders'
import { CustomerNotes } from './CustomerNotes'
import { useAuth } from '@/contexts/AuthContext'

interface CustomerDetailViewProps {
  customer: CustomerProfile
}

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'orders' | 'timeline' | 'tasks' | 'notes'>('orders')

  // Get health score visibility preference from user metadata
  const showHealthScore = profile?.metadata?.crm_preferences?.show_health_score ?? true

  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [tasks, setTasks] = useState<CustomerTask[]>([])
  const [orders, setOrders] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [activitiesData, notesData, tasksData, ordersData] = await Promise.all([
        getCustomerActivities(customer.customer_email),
        getCustomerNotes(customer.customer_email),
        getCustomerTasks(customer.customer_email),
        getCustomerOrders(customer.customer_email),
      ])
      
      setActivities(activitiesData)
      setNotes(notesData)
      setTasks(tasksData)
      setOrders(ordersData)
    } catch (err) {
      console.error('Failed to load customer data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotesUpdate = async () => {
    const notesData = await getCustomerNotes(customer.customer_email)
    setNotes(notesData)
    // Reload activities to show new note activity
    const activitiesData = await getCustomerActivities(customer.customer_email)
    setActivities(activitiesData)
  }

  const handleTasksUpdate = async () => {
    const tasksData = await getCustomerTasks(customer.customer_email)
    setTasks(tasksData)
    // Reload activities to show task activity
    const activitiesData = await getCustomerActivities(customer.customer_email)
    setActivities(activitiesData)
  }

  const handleOrdersUpdate = async () => {
    const ordersData = await getCustomerOrders(customer.customer_email)
    setOrders(ordersData)
    // Reload activities to show order status change
    const activitiesData = await getCustomerActivities(customer.customer_email)
    setActivities(activitiesData)
  }

  // Find phone from any order (check all orders, not just first)
  const findPhone = (): string | null => {
    // First check the customer profile (from unified view)
    if (customer.phone) return customer.phone

    // Then check orders for customer_phone or address phone
    for (const order of orders) {
      if (order.customer_phone) return order.customer_phone
      if (order.billing_address?.phone) return order.billing_address.phone
      if (order.shipping_address?.phone) return order.shipping_address.phone
    }
    return null
  }

  // Find address from any order (prefer billing, then shipping)
  const findAddress = () => {
    for (const order of orders) {
      // Check billing address first
      if (order.billing_address) {
        const addr = order.billing_address
        // Check if it has meaningful data (city, state, or postal code)
        if (addr.city || addr.state || addr.postal_code || addr.postalCode || addr.zip_code) {
          return addr
        }
      }
      // Fall back to shipping address
      if (order.shipping_address) {
        const addr = order.shipping_address
        if (addr.city || addr.state || addr.postal_code || addr.postalCode || addr.zip_code) {
          return addr
        }
      }
    }
    return null
  }

  const customerPhone = findPhone()
  const customerAddress = findAddress()

  const tabs = [
    { id: 'orders' as const, label: 'Orders', count: orders.length },
    { id: 'notes' as const, label: 'Notes', count: notes.length },
    { id: 'tasks' as const, label: 'Tasks', count: tasks.filter(t => t.status !== 'completed').length },
    { id: 'timeline' as const, label: 'Activity', count: activities.length },
  ]

  const customerName = customer.name || 'Unknown Customer'

  return (
    <div className="space-y-6">
      {/* Breadcrumb with customer name */}
      <nav className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <button
          onClick={() => router.push('/admin/crm')}
          className="h-8 px-2 flex items-center gap-1 rounded-md hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <ol className="flex items-center gap-1">
          <li className="flex items-center gap-1">
            <Link href="/admin/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">Dashboard</span>
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span>Customers</span>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <Link href="/admin/crm" className="hover:text-foreground transition-colors">
              Customers
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{customerName}</span>
          </li>
        </ol>
      </nav>

      {/* Customer Profile Card */}
      <CustomerProfileCard
        customer={customer}
        onUpdate={loadData}
        showHealthScore={showHealthScore}
        address={customerAddress}
        phone={customerPhone}
        notesCount={notes.length}
        tasksCount={tasks.filter(t => t.status !== 'completed').length}
        onNotesClick={() => setActiveTab('notes')}
        onTasksClick={() => setActiveTab('tasks')}
      />

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs bg-muted rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <CustomerOrders orders={orders} onOrderUpdate={handleOrdersUpdate} />
            )}
            {activeTab === 'notes' && (
              <CustomerNotes
                notes={notes}
                customerEmail={customer.customer_email}
                onUpdate={handleNotesUpdate}
              />
            )}
            {activeTab === 'tasks' && (
              <CustomerTasks
                tasks={tasks}
                customerEmail={customer.customer_email}
                onUpdate={handleTasksUpdate}
              />
            )}
            {activeTab === 'timeline' && (
              <ActivityTimeline activities={activities} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
