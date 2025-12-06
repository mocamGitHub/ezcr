import { Metadata } from 'next'
import ConfiguratorSmooth from '@/components/configurator-v2/ConfiguratorSmooth'

export const metadata: Metadata = {
  title: 'Configure Your Ramp | EZ Cycle Ramp',
  description: 'Configure the perfect motorcycle loading ramp for your vehicle with our 5-step customization tool.',
}

export default function ConfigureSmoothPage() {
  return <ConfiguratorSmooth />
}
