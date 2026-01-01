import { redirect } from 'next/navigation'
import { getDefaultDashboard } from './dashboard-actions'

// Redirect to the default registry-driven dashboard
export default async function AdminDashboardPage() {
  const defaultDashboard = await getDefaultDashboard()
  const dashboardKey = defaultDashboard?.key || 'executive'
  redirect(`/admin/dashboard/${dashboardKey}`)
}
