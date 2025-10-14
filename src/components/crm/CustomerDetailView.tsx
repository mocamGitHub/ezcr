'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerProfile, CRMActivity, CustomerNote, CustomerTask } from '@/types/crm'
import { getCustomerActivities, getCustomerNotes, getCustomerTasks, getCustomerOrders } from '@/actions/crm'
import { CustomerProfileCard } from './CustomerProfileCard'
import { ActivityTimeline } from './ActivityTimeline'
import { CustomerNotes } from './CustomerNotes'
import { CustomerTasks } from './CustomerTasks'
import { CustomerOrders } from './CustomerOrders'

interface CustomerDetailViewProps {
  customer: CustomerProfile
}

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'tasks' | 'orders'>('timeline')
  
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

  const tabs = [
    { id: 'timeline' as const, label: 'Activity Timeline', count: activities.length },
    { id: 'notes' as const, label: 'Notes', count: notes.length },
    { id: 'tasks' as const, label: 'Tasks', count: tasks.filter(t => t.status !== 'completed').length },
    { id: 'orders' as const, label: 'Orders', count: orders.length },
  ]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/crm')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>←</span>
        Back to Customers
      </button>

      {/* Customer Profile Card */}
      <CustomerProfileCard customer={customer} onUpdate={loadData} />

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
            {activeTab === 'timeline' && (
              <ActivityTimeline activities={activities} />
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
            {activeTab === 'orders' && (
              <CustomerOrders orders={orders} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
