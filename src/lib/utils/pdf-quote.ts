import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface QuoteData {
  contact: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  vehicle: string
  measurements: {
    bedLengthClosed?: number
    bedLengthOpen?: number
    cargoLength?: number
    loadHeight?: number
  }
  motorcycle: {
    type: string
    weight?: number
    wheelbase?: number
    length?: number
  }
  selectedModel: {
    name: string
    price: number
  }
  extension: {
    name: string
    price: number
  }
  boltlessKit: {
    name: string
    price: number
  }
  tiedown: {
    name: string
    price: number
  }
  service: {
    name: string
    price: number
  }
  delivery: {
    name: string
    price: number
  }
  subtotal: number
  salesTax: number
  processingFee: number
  total: number
}

export function generateQuotePDF(data: QuoteData) {
  const doc = new jsPDF()

  // Colors
  const primaryBlue = '#005696'
  const secondaryOrange = '#ff8c00'
  const darkGray = '#333333'
  const lightGray = '#666666'

  // Header
  doc.setFillColor(primaryBlue)
  doc.rect(0, 0, 220, 40, 'F')

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EZ CYCLE', 20, 20)

  doc.setTextColor(secondaryOrange)
  doc.text('RAMP', 60, 20)

  // Subtitle
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Custom Configuration Quote', 20, 30)

  // Quote date
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.setFontSize(10)
  doc.text(`Date: ${today}`, 150, 30)

  let yPosition = 50

  // Customer Information Section
  doc.setTextColor(primaryBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Information', 20, yPosition)

  yPosition += 3
  doc.setDrawColor(primaryBlue)
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, 190, yPosition)

  yPosition += 8
  doc.setTextColor(darkGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const customerInfo = [
    ['Name:', `${data.contact.firstName} ${data.contact.lastName}`],
    ['Email:', data.contact.email],
    ...(data.contact.phone ? [['Phone:', data.contact.phone]] : []),
  ]

  customerInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 25, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)
    yPosition += 6
  })

  yPosition += 5

  // Vehicle Details Section
  doc.setTextColor(primaryBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Vehicle Details', 20, yPosition)

  yPosition += 3
  doc.line(20, yPosition, 190, yPosition)

  yPosition += 8
  doc.setTextColor(darkGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const vehicleInfo = [
    ['Vehicle Type:', data.vehicle.charAt(0).toUpperCase() + data.vehicle.slice(1)],
    ...(data.measurements.bedLengthClosed
      ? [['Cargo Area (Closed):', `${data.measurements.bedLengthClosed.toFixed(1)}"`]]
      : []),
    ...(data.measurements.cargoLength
      ? [['Cargo Length:', `${data.measurements.cargoLength.toFixed(1)}"`]]
      : []),
    ...(data.measurements.loadHeight
      ? [['Load Height:', `${data.measurements.loadHeight.toFixed(1)}"`]]
      : []),
  ]

  vehicleInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 25, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)
    yPosition += 6
  })

  yPosition += 5

  // Motorcycle Details Section
  doc.setTextColor(primaryBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Motorcycle Details', 20, yPosition)

  yPosition += 3
  doc.line(20, yPosition, 190, yPosition)

  yPosition += 8
  doc.setTextColor(darkGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const motorcycleInfo = [
    ['Type:', data.motorcycle.type.charAt(0).toUpperCase() + data.motorcycle.type.slice(1)],
    ...(data.motorcycle.weight ? [['Weight:', `${data.motorcycle.weight.toFixed(1)} lbs`]] : []),
    ...(data.motorcycle.wheelbase ? [['Wheelbase:', `${data.motorcycle.wheelbase.toFixed(1)}"`]] : []),
    ...(data.motorcycle.length ? [['Length:', `${data.motorcycle.length.toFixed(1)}"`]] : []),
  ]

  motorcycleInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 25, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)
    yPosition += 6
  })

  yPosition += 10

  // Configuration Table
  doc.setTextColor(primaryBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Selected Configuration', 20, yPosition)

  yPosition += 5

  const configItems = [
    [data.selectedModel.name, `$${data.selectedModel.price.toFixed(2)}`],
    ...(data.extension.price > 0
      ? [[data.extension.name, `$${data.extension.price.toFixed(2)}`]]
      : []),
    ...(data.boltlessKit.price > 0
      ? [[data.boltlessKit.name, `$${data.boltlessKit.price.toFixed(2)}`]]
      : []),
    ...(data.tiedown.price > 0
      ? [[data.tiedown.name, `$${data.tiedown.price.toFixed(2)}`]]
      : []),
    ...(data.service.price > 0
      ? [[data.service.name, `$${data.service.price.toFixed(2)}`]]
      : []),
    ...(data.delivery.price > 0
      ? [[data.delivery.name, `$${data.delivery.price.toFixed(2)}`]]
      : []),
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Price']],
    body: configItems,
    theme: 'striped',
    headStyles: {
      fillColor: primaryBlue,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: darkGray,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  })

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Price Breakdown
  doc.setTextColor(primaryBlue)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Price Breakdown', 20, finalY)

  let priceY = finalY + 8
  doc.setFontSize(11)
  doc.setTextColor(darkGray)

  const priceBreakdown = [
    ['Subtotal:', `$${data.subtotal.toFixed(2)}`],
    ['Sales Tax (8.9%):', `$${data.salesTax.toFixed(2)}`],
    ['Processing Fee (3%):', `$${data.processingFee.toFixed(2)}`],
  ]

  priceBreakdown.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, 25, priceY)
    doc.text(value, 190, priceY, { align: 'right' })
    priceY += 7
  })

  // Total line
  doc.setDrawColor(primaryBlue)
  doc.setLineWidth(1)
  doc.line(20, priceY, 190, priceY)

  priceY += 8
  doc.setTextColor(primaryBlue)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', 25, priceY)
  doc.text(`$${data.total.toFixed(2)}`, 190, priceY, { align: 'right' })

  // Footer
  const footerY = 270
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(20, footerY, 190, footerY)

  doc.setTextColor(lightGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('EZ Cycle Ramp', 105, footerY + 7, { align: 'center' })
  doc.text('Phone: 800-687-4410 | Email: support@ezcycleramp.com', 105, footerY + 13, {
    align: 'center',
  })
  doc.setFontSize(8)
  doc.text(`© ${new Date().getFullYear()} NEO-DYNE, USA. All rights reserved.`, 105, footerY + 18, {
    align: 'center',
  })

  // Save the PDF
  const fileName = `EZ-Cycle-Ramp-Quote-${data.contact.lastName}-${Date.now()}.pdf`
  doc.save(fileName)
}
