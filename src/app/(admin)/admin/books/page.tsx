'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Receipt,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  FileImage,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  getBooksKPIs,
  getReceiptQueue,
  getBankTransactions,
  confirmMatch,
  rejectMatch,
  bulkConfirmMatches,
  bulkRejectMatches,
  getClientTenantId,
  type BooksKPISummary,
  type ReceiptQueueItem,
  type BankTransaction,
  // type MatchSuggestion, // Currently unused
} from '@/actions/books'

type SortDirection = 'asc' | 'desc' | null
type Tab = 'receipts' | 'transactions'

export default function BooksPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('receipts')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Tenant ID for uploads
  const [tenantId, setTenantId] = useState<string | null>(null)

  // File upload refs and state
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // KPI data
  const [kpis, setKpis] = useState<BooksKPISummary | null>(null)

  // Receipt queue state
  const [receipts, setReceipts] = useState<ReceiptQueueItem[]>([])
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'exceptions'>('all')
  const [receiptSortColumn, setReceiptSortColumn] = useState<string | null>('created_at')
  const [receiptSortDirection, setReceiptSortDirection] = useState<SortDirection>('desc')
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set())
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(new Set())

  // Bank transactions state
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [txnSearch, setTxnSearch] = useState('')
  const [txnClearedFilter, setTxnClearedFilter] = useState<'all' | 'cleared' | 'uncleared'>('all')
  const [txnSortColumn, setTxnSortColumn] = useState<string | null>('posted_at')
  const [txnSortDirection, setTxnSortDirection] = useState<SortDirection>('desc')

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load tenant ID on mount
  useEffect(() => {
    getClientTenantId().then(setTenantId).catch(console.error)
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [kpiData, receiptData, txnData] = await Promise.all([
        getBooksKPIs(),
        getReceiptQueue(
          { search: receiptSearch, status: receiptStatusFilter },
          receiptSortColumn ? { field: receiptSortColumn as any, direction: receiptSortDirection || 'desc' } : undefined
        ),
        getBankTransactions(
          { search: txnSearch, cleared: txnClearedFilter },
          txnSortColumn ? { field: txnSortColumn as any, direction: txnSortDirection || 'desc' } : undefined
        ),
      ])

      setKpis(kpiData)
      setReceipts(receiptData.receipts)
      setTransactions(txnData.transactions)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [receiptSearch, receiptStatusFilter, receiptSortColumn, receiptSortDirection, txnSearch, txnClearedFilter, txnSortColumn, txnSortDirection])

  useEffect(() => {
    loadData()
  }, [loadData])

  // File upload handlers
  const handleReceiptUpload = async (files: FileList | File[]) => {
    if (!tenantId) {
      toast.error('Tenant not configured')
      return
    }

    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('tenant_id', tenantId)
        formData.append('file', file)

        const res = await fetch('/api/books/receipts/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok && data.ok) {
          successCount++
        } else {
          errorCount++
          console.error(`Upload failed for ${file.name}:`, data.error)
        }
      } catch (error) {
        errorCount++
        console.error(`Upload error for ${file.name}:`, error)
      }
    }

    setUploading(false)

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} receipt${successCount !== 1 ? 's' : ''}`)
      loadData() // Refresh the list
    }
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`)
    }
  }

  const handleCSVImport = async (file: File) => {
    if (!tenantId) {
      toast.error('Tenant not configured')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('tenant_id', tenantId)
      formData.append('file', file)

      const res = await fetch('/api/books/bank/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        toast.success('Bank transactions imported successfully')
        loadData() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to import CSV')
      }
    } catch (error) {
      console.error('CSV import error:', error)
      toast.error('Failed to import CSV')
    } finally {
      setUploading(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      // Check if it's a CSV file
      const firstFile = files[0]
      if (firstFile.type === 'text/csv' || firstFile.name.endsWith('.csv')) {
        await handleCSVImport(firstFile)
      } else {
        await handleReceiptUpload(files)
      }
    }
  }

  const handleReceiptInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleReceiptUpload(e.target.files)
      e.target.value = '' // Reset input
    }
  }

  const handleCSVInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVImport(e.target.files[0])
      e.target.value = '' // Reset input
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Receipt sorting
  const handleReceiptSort = (column: string) => {
    if (receiptSortColumn === column) {
      if (receiptSortDirection === 'asc') {
        setReceiptSortDirection('desc')
      } else if (receiptSortDirection === 'desc') {
        setReceiptSortColumn(null)
        setReceiptSortDirection(null)
      }
    } else {
      setReceiptSortColumn(column)
      setReceiptSortDirection('asc')
    }
  }

  // Transaction sorting
  const handleTxnSort = (column: string) => {
    if (txnSortColumn === column) {
      if (txnSortDirection === 'asc') {
        setTxnSortDirection('desc')
      } else if (txnSortDirection === 'desc') {
        setTxnSortColumn(null)
        setTxnSortDirection(null)
      }
    } else {
      setTxnSortColumn(column)
      setTxnSortDirection('asc')
    }
  }

  // Receipt selection
  const toggleReceiptSelection = (id: string) => {
    const newSelection = new Set(selectedReceipts)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedReceipts(newSelection)
  }

  const toggleAllReceipts = () => {
    if (selectedReceipts.size === receipts.length) {
      setSelectedReceipts(new Set())
    } else {
      setSelectedReceipts(new Set(receipts.map(r => r.document_id)))
    }
  }

  // Expand/collapse receipt row
  const toggleReceiptExpand = (id: string) => {
    const newExpanded = new Set(expandedReceipts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedReceipts(newExpanded)
  }

  // Confirm match
  const handleConfirmMatch = async (matchId: string) => {
    setActionLoading(matchId)
    try {
      const result = await confirmMatch(matchId)
      if (result.ok) {
        toast.success('Match confirmed')
        loadData()
      } else {
        toast.error(result.error || 'Failed to confirm match')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Reject match
  const handleRejectMatch = async (matchId: string) => {
    setActionLoading(matchId)
    try {
      const result = await rejectMatch(matchId)
      if (result.ok) {
        toast.success('Match rejected')
        loadData()
      } else {
        toast.error(result.error || 'Failed to reject match')
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk confirm
  const handleBulkConfirm = async () => {
    // Get all suggested match IDs from selected receipts
    const matchIds: string[] = []
    for (const docId of selectedReceipts) {
      const receipt = receipts.find(r => r.document_id === docId)
      if (receipt?.top_suggestions) {
        const suggested = receipt.top_suggestions.find(s => s.status === 'suggested')
        if (suggested) {
          matchIds.push(suggested.match_id)
        }
      }
    }

    if (matchIds.length === 0) {
      toast.error('No suggested matches to confirm')
      return
    }

    setActionLoading('bulk')
    try {
      const result = await bulkConfirmMatches(matchIds)
      if (result.ok) {
        toast.success(`Confirmed ${result.confirmed} matches`)
      } else {
        toast.success(`Confirmed ${result.confirmed} matches, ${result.errors.length} errors`)
      }
      setSelectedReceipts(new Set())
      loadData()
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk reject
  const handleBulkReject = async () => {
    const matchIds: string[] = []
    for (const docId of selectedReceipts) {
      const receipt = receipts.find(r => r.document_id === docId)
      if (receipt?.top_suggestions) {
        for (const suggestion of receipt.top_suggestions) {
          if (suggestion.status === 'suggested') {
            matchIds.push(suggestion.match_id)
          }
        }
      }
    }

    if (matchIds.length === 0) {
      toast.error('No suggested matches to reject')
      return
    }

    setActionLoading('bulk')
    try {
      const result = await bulkRejectMatches(matchIds)
      if (result.ok) {
        toast.success(`Rejected ${result.rejected} matches`)
      } else {
        toast.success(`Rejected ${result.rejected} matches, ${result.errors.length} errors`)
      }
      setSelectedReceipts(new Set())
      loadData()
    } finally {
      setActionLoading(null)
    }
  }

  // Status colors
  const getStatusBadge = (receipt: ReceiptQueueItem) => {
    if (receipt.is_matched) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Matched</Badge>
    }
    if (receipt.confidence_overall && receipt.confidence_overall < 0.6) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Exception</Badge>
    }
    if (receipt.suggested_count > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">No Match</Badge>
  }

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'text-gray-400'
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="py-8 px-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground mt-1">
            Receipt & bank transaction matching
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/books/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" />
              Receipts
            </div>
            <div className="text-2xl font-bold mt-1">{kpis.receipts_total}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Matched
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{kpis.receipts_matched}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-yellow-500" />
              Unmatched
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{kpis.receipts_unmatched}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Exceptions
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{kpis.receipts_exceptions}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Bank Txns
            </div>
            <div className="text-2xl font-bold mt-1">{kpis.bank_txns_total}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Cleared
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{kpis.bank_txns_cleared}</div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div
        className={cn(
          'flex items-center gap-4 mb-6 p-4 rounded-lg border-2 border-dashed transition-colors',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Upload className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        )}
        <div className="flex-1">
          <p className="font-medium">
            {uploading ? 'Uploading...' : isDragging ? 'Drop files here' : 'Upload Documents'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isDragging
              ? 'Drop receipts (PDF, images) or bank CSV'
              : 'Drag & drop receipts or click to browse. CSV files import as bank transactions.'}
          </p>
        </div>
        {/* Hidden file inputs */}
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleReceiptInputChange}
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleCSVInputChange}
        />
        <Button
          variant="outline"
          onClick={() => receiptInputRef.current?.click()}
          disabled={uploading}
        >
          <FileImage className="mr-2 h-4 w-4" />
          Upload Receipt
        </Button>
        <Button
          variant="outline"
          onClick={() => csvInputRef.current?.click()}
          disabled={uploading}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('receipts')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'receipts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Receipt Queue ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'transactions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Bank Transactions ({transactions.length})
        </button>
      </div>

      {/* Receipt Queue Tab */}
      {activeTab === 'receipts' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by vendor..."
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={receiptStatusFilter} onValueChange={(v) => setReceiptStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Receipts</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="exceptions">Exceptions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedReceipts.size > 0 && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedReceipts.size} receipt{selectedReceipts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkConfirm}
                  disabled={actionLoading === 'bulk'}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={actionLoading === 'bulk'}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReceipts(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Receipt Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedReceipts.size === receipts.length && receipts.length > 0}
                      onCheckedChange={toggleAllReceipts}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <SortableTableHead
                    sortKey="vendor_guess"
                    currentSort={receiptSortColumn}
                    currentDirection={receiptSortDirection}
                    onSort={handleReceiptSort}
                  >
                    Vendor
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="total_amount"
                    currentSort={receiptSortColumn}
                    currentDirection={receiptSortDirection}
                    onSort={handleReceiptSort}
                  >
                    Amount
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="document_date"
                    currentSort={receiptSortColumn}
                    currentDirection={receiptSortDirection}
                    onSort={handleReceiptSort}
                  >
                    Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="confidence_overall"
                    currentSort={receiptSortColumn}
                    currentDirection={receiptSortDirection}
                    onSort={handleReceiptSort}
                  >
                    Confidence
                  </SortableTableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Suggestions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => (
                    <>
                      <TableRow
                        key={receipt.document_id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          expandedReceipts.has(receipt.document_id) && 'bg-muted/30'
                        )}
                        onClick={() => toggleReceiptExpand(receipt.document_id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedReceipts.has(receipt.document_id)}
                            onCheckedChange={() => toggleReceiptSelection(receipt.document_id)}
                            aria-label={`Select ${receipt.vendor_guess || 'receipt'}`}
                          />
                        </TableCell>
                        <TableCell>
                          {receipt.suggested_count > 0 && (
                            expandedReceipts.has(receipt.document_id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {receipt.vendor_guess || <span className="text-muted-foreground italic">Unknown</span>}
                        </TableCell>
                        <TableCell>{formatCurrency(receipt.total_amount, receipt.currency)}</TableCell>
                        <TableCell>{formatDate(receipt.document_date)}</TableCell>
                        <TableCell>
                          <span className={getConfidenceColor(receipt.confidence_overall)}>
                            {receipt.confidence_overall ? `${Math.round(receipt.confidence_overall * 100)}%` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(receipt)}</TableCell>
                        <TableCell>
                          {receipt.suggested_count > 0 ? (
                            <span className="text-blue-600">{receipt.suggested_count} suggestion{receipt.suggested_count !== 1 ? 's' : ''}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Expanded suggestions */}
                      {expandedReceipts.has(receipt.document_id) && receipt.top_suggestions && receipt.top_suggestions.length > 0 && (
                        <TableRow key={`${receipt.document_id}-suggestions`} className="bg-muted/20">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4 pl-12">
                              <p className="text-sm font-medium mb-2">Match Suggestions</p>
                              <div className="space-y-2">
                                {receipt.top_suggestions.map((suggestion) => (
                                  <div
                                    key={suggestion.match_id}
                                    className="flex items-center justify-between p-3 bg-card rounded-lg border"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <p className="font-medium">{suggestion.txn.merchant}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDate(suggestion.txn.posted_at)} &bull; {formatCurrency(suggestion.txn.amount, suggestion.txn.currency)}
                                        </p>
                                      </div>
                                      <Badge variant="outline">
                                        {Math.round(suggestion.score * 100)}% match
                                      </Badge>
                                      {suggestion.status === 'auto_linked' && (
                                        <Badge className="bg-blue-100 text-blue-800">Auto-linked</Badge>
                                      )}
                                      {suggestion.status === 'confirmed' && (
                                        <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                                      )}
                                      {suggestion.status === 'rejected' && (
                                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                                      )}
                                    </div>
                                    {suggestion.status === 'suggested' && (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleConfirmMatch(suggestion.match_id)
                                          }}
                                          disabled={actionLoading === suggestion.match_id}
                                        >
                                          <Check className="mr-1 h-4 w-4" />
                                          Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRejectMatch(suggestion.match_id)
                                          }}
                                          disabled={actionLoading === suggestion.match_id}
                                        >
                                          <X className="mr-1 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Bank Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by merchant..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={txnClearedFilter} onValueChange={(v) => setTxnClearedFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="uncleared">Uncleared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="posted_at"
                    currentSort={txnSortColumn}
                    currentDirection={txnSortDirection}
                    onSort={handleTxnSort}
                  >
                    Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="merchant"
                    currentSort={txnSortColumn}
                    currentDirection={txnSortDirection}
                    onSort={handleTxnSort}
                  >
                    Merchant
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="amount"
                    currentSort={txnSortColumn}
                    currentDirection={txnSortDirection}
                    onSort={handleTxnSort}
                  >
                    Amount
                  </SortableTableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{formatDate(txn.posted_at)}</TableCell>
                      <TableCell className="font-medium">{txn.merchant}</TableCell>
                      <TableCell>{formatCurrency(txn.amount, txn.currency)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {txn.description || '-'}
                      </TableCell>
                      <TableCell>
                        {txn.cleared ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Cleared
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Uncleared
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.bank_source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
