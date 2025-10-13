import { Suspense } from 'react'
import { CustomerList } from '@/components/crm/CustomerList'
import { CustomerListSkeleton } from '@/components/crm/CustomerListSkeleton'

export const metadata = {
  title: 'CRM - Customer Management',
  description: 'Manage customer relationships and track engagement',
}

export default function CRMPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all customer interactions, orders, and engagement
        </p>
      </div>

      <Suspense fallback={<CustomerListSkeleton />}>
        <CustomerList />
      </Suspense>
    </div>
  )
}
