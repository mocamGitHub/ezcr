import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCustomerProfile } from '@/actions/crm'
import { CustomerDetailView } from '@/components/crm/CustomerDetailView'
import { CustomerDetailSkeleton } from '@/components/crm/CustomerDetailSkeleton'

interface CustomerDetailPageProps {
  params: Promise<{
    email: string
  }>
}

export async function generateMetadata({ params }: CustomerDetailPageProps) {
  const { email } = await params
  const decodedEmail = decodeURIComponent(email)
  
  return {
    title: `${decodedEmail} - Customer Details`,
    description: `View and manage customer profile for ${decodedEmail}`,
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { email } = await params
  const decodedEmail = decodeURIComponent(email)

  // Validate email format
  if (!decodedEmail.includes('@')) {
    notFound()
  }

  const customer = await getCustomerProfile(decodedEmail)

  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetailView customer={customer} />
      </Suspense>
    </div>
  )
}
