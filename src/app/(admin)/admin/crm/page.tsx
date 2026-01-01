import { Suspense } from 'react'
import { CustomerList } from '@/components/crm/CustomerList'
import { CustomerListSkeleton } from '@/components/crm/CustomerListSkeleton'
import { EnvironmentBadge } from '@/components/EnvironmentBanner'
import { PageHeader } from '@/components/admin'

export const metadata = {
  title: 'CRM - Customer Management',
  description: 'Manage customer relationships and track engagement',
}

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Relationship Management"
        description="View and manage all customer interactions, orders, and engagement"
        secondaryActions={<EnvironmentBadge />}
      />

      <Suspense fallback={<CustomerListSkeleton />}>
        <CustomerList />
      </Suspense>
    </div>
  )
}
