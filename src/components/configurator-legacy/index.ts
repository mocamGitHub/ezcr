// Legacy Configurator Components - Barrel Export
// These are preserved versions from before UFE implementation

export { default as QuickConfiguratorV2 } from './QuickConfiguratorV2'
export { default as QuickConfiguratorOriginal } from './QuickConfiguratorOriginal'
export { default as Configurator } from './Configurator'
export { default as ConfiguratorSmooth } from './ConfiguratorSmooth'

// Re-export providers
export { ConfiguratorProvider, useConfigurator } from './ConfiguratorProvider'
export { ConfiguratorSettingsProvider } from './ConfiguratorSettingsProvider'

// Re-export step components
export { Step1VehicleType } from './Step1VehicleType'
export { Step2Measurements } from './Step2Measurements'
export { Step3Motorcycle } from './Step3Motorcycle'
export { Step4Configuration } from './Step4Configuration'
export { Step5Quote } from './Step5Quote'

// Re-export utility components
export { ConfiguratorHeader } from './ConfiguratorHeader'
export { ProgressBar } from './ProgressBar'
export { ChatWidget } from './ChatWidget'
export { ContactModal } from './ContactModal'
export { AIValidationMessage } from './AIValidationMessage'
export { ConfigurationHistory } from './ConfigurationHistory'
