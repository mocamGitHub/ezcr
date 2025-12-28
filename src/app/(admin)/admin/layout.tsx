'use client'

import { useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add class to body to hide main Header/Footer when in admin section
  useEffect(() => {
    document.body.classList.add('admin-layout')
    return () => {
      document.body.classList.remove('admin-layout')
    }
  }, [])

  return (
    <AdminLayout>
      {children}
      <GlobalSearch />
    </AdminLayout>
  )
}
