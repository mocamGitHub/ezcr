/**
 * Export utilities for generating CSV and Excel downloads
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExportDataRow = Record<string, any>

interface ExportColumn {
  key: string
  header: string
  formatter?: (value: unknown) => string
}

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends ExportDataRow>(data: T[], columns: ExportColumn[]): string {
  if (data.length === 0) return ''

  // Generate header row
  const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`)
  const headerRow = headers.join(',')

  // Generate data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '')
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends ExportDataRow>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`
  downloadCSV(csv, finalFilename)
}

// Predefined column configurations for common exports

export const orderColumns: ExportColumn[] = [
  { key: 'order_number', header: 'Order Number' },
  { key: 'customer_name', header: 'Customer Name' },
  { key: 'customer_email', header: 'Customer Email' },
  { key: 'status', header: 'Status' },
  { key: 'payment_status', header: 'Payment Status' },
  {
    key: 'total_amount',
    header: 'Total',
    formatter: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''
  },
  {
    key: 'created_at',
    header: 'Order Date',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
]

export const inventoryColumns: ExportColumn[] = [
  { key: 'name', header: 'Product Name' },
  { key: 'sku', header: 'SKU' },
  { key: 'inventory_count', header: 'Stock Quantity' },
  { key: 'low_stock_threshold', header: 'Low Stock Threshold' },
  {
    key: 'base_price',
    header: 'Price',
    formatter: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''
  },
  {
    key: 'is_active',
    header: 'Active',
    formatter: (v) => v ? 'Yes' : 'No'
  },
]

export const customerColumns: ExportColumn[] = [
  { key: 'name', header: 'Customer Name' },
  { key: 'customer_email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'order_count', header: 'Total Orders' },
  {
    key: 'lifetime_value',
    header: 'Lifetime Value',
    formatter: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''
  },
  { key: 'health_score', header: 'Health Score' },
  { key: 'tags', header: 'Tags' },
  {
    key: 'first_order_date',
    header: 'First Order',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
  {
    key: 'last_order_date',
    header: 'Last Order',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
]

export const testimonialColumns: ExportColumn[] = [
  { key: 'customer_name', header: 'Customer Name' },
  { key: 'customer_email', header: 'Email' },
  { key: 'rating', header: 'Rating' },
  { key: 'status', header: 'Status' },
  {
    key: 'is_featured',
    header: 'Featured',
    formatter: (v) => v ? 'Yes' : 'No'
  },
  { key: 'review_text', header: 'Review' },
  {
    key: 'created_at',
    header: 'Date',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
]

export const contactColumns: ExportColumn[] = [
  { key: 'company_name', header: 'Company' },
  { key: 'contact_name', header: 'Contact Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'contact_type', header: 'Type' },
  { key: 'status', header: 'Status' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  {
    key: 'created_at',
    header: 'Created',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
]

export const bookingColumns: ExportColumn[] = [
  { key: 'title', header: 'Appointment' },
  { key: 'attendee_email', header: 'Attendee Email' },
  { key: 'host_email', header: 'Host Email' },
  { key: 'status', header: 'Status' },
  {
    key: 'start_at',
    header: 'Start Date',
    formatter: (v) => v ? new Date(v as string).toLocaleString() : ''
  },
  {
    key: 'end_at',
    header: 'End Date',
    formatter: (v) => v ? new Date(v as string).toLocaleString() : ''
  },
  {
    key: 'created_at',
    header: 'Booked On',
    formatter: (v) => v ? new Date(v as string).toLocaleDateString() : ''
  },
]

export const auditColumns: ExportColumn[] = [
  {
    key: 'created_at',
    header: 'Time',
    formatter: (v) => v ? new Date(v as string).toLocaleString() : ''
  },
  { key: 'actor_type', header: 'Actor Type' },
  { key: 'user_email', header: 'User Email' },
  { key: 'action', header: 'Action' },
  { key: 'resource_type', header: 'Resource Type' },
  { key: 'resource_id', header: 'Resource ID' },
  { key: 'ip_address', header: 'IP Address' },
]

/**
 * Format current date for export filename
 */
export function getExportFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}-${date}.csv`
}
