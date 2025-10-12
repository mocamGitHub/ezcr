import { Metadata } from 'next'
import { ConfiguratorProvider } from '@/contexts/ConfiguratorContext'
import Configurator from '@/components/configurator/Configurator'

export const metadata: Metadata = {
  title: 'Configure Your Ramp | EZ Cycle Ramp',
  description: 'Configure the perfect motorcycle loading ramp for your vehicle with our 5-step customization tool.',
}

export default function ConfigurePage() {
  return (
    <ConfiguratorProvider>
      <Configurator />
    </ConfiguratorProvider>
  )
}
