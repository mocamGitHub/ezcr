import { Metadata } from 'next'
import QuickConfiguratorUFE from '@/components/configurator-v2/QuickConfiguratorUFE'

export const metadata: Metadata = {
  title: 'Quick Ramp Finder | EZ Cycle Ramp',
  description: 'Find the perfect motorcycle loading ramp for your truck in under a minute with our Quick Ramp Finder.',
}

export default function QuickConfigureUFEPage() {
  return <QuickConfiguratorUFE />
}
