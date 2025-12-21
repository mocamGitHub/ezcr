// QuickBooks Online Types

export interface QboInvoice {
  qbo_entity_id: string
  doc_number: string | null
  txn_date: string | null
  customer_name: string | null
  customer_ref: string | null
  total_amount: number | null
  status: string | null
  currency: string | null
  balance: number | null
  bill_email: string | null
}

export interface QboInvoiceLine {
  line_num: number
  item_name: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  line_amount: number | null
}

export interface QboInvoiceWithLines extends QboInvoice {
  lines: QboInvoiceLine[]
}

export interface QboInvoiceFilters {
  search?: string
  status?: 'all' | 'Paid' | 'Sent' | 'Viewed' | 'Overdue' | 'Outstanding'
  dateFrom?: string
  dateTo?: string
}

export interface QboInvoiceStats {
  totalInvoices: number
  totalRevenue: number
  paidCount: number
  outstandingCount: number
}
