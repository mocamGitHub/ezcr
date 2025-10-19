import { Metadata } from 'next'
import { ConfigurationHistory } from '@/components/configurator-v2/ConfigurationHistory'

export const metadata: Metadata = {
  title: 'Configuration History | EZ Cycle Ramp',
  description: 'View and manage your saved ramp configurations.',
}

export default function ConfigurationHistoryPage() {
  return <ConfigurationHistory />
}
