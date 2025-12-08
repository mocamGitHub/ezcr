'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
}

interface InventoryAdjustmentDialogProps {
  product: Product
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultType?: 'increase' | 'decrease'
}

type TransactionType = 'adjustment' | 'restock' | 'damage' | 'initial'

export function InventoryAdjustmentDialog({
  product,
  open,
  onClose,
  onSuccess,
  defaultType = 'increase',
}: InventoryAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState<string>('')
  const [transactionType, setTransactionType] = useState<TransactionType>('adjustment')
  const [reason, setReason] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>(defaultType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const quantityNum = parseInt(quantity)
      if (isNaN(quantityNum) || quantityNum <= 0) {
        throw new Error('Please enter a valid quantity')
      }

      if (!reason.trim()) {
        throw new Error('Please provide a reason for the adjustment')
      }

      // Calculate the quantity change (negative for decrease, positive for increase)
      const quantityChange = adjustmentType === 'decrease' ? -quantityNum : quantityNum

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantityChange,
          transactionType,
          reason: reason.trim(),
          referenceId: referenceId.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust inventory')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const newInventoryCount =
    adjustmentType === 'increase'
      ? product.inventory_count + (parseInt(quantity) || 0)
      : product.inventory_count - (parseInt(quantity) || 0)

  const handleClose = () => {
    if (!loading) {
      setQuantity('')
      setReason('')
      setReferenceId('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background border-2 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              Make changes to inventory levels for <strong>{product.name}</strong> (SKU:{' '}
              {product.sku})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 pb-4 max-h-[50vh] overflow-y-auto">
            {/* Current Stock Display */}
            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Stock:</span>
                <span className="text-lg font-semibold">{product.inventory_count}</span>
              </div>
              {parseInt(quantity) > 0 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">New Stock:</span>
                  <span
                    className={`text-lg font-semibold ${
                      newInventoryCount < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {newInventoryCount}
                  </span>
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <div className="grid gap-2">
              <Label>Adjustment Type</Label>
              <Select
                value={adjustmentType}
                onValueChange={(value) => setAdjustmentType(value as 'increase' | 'decrease')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
                disabled={loading || success}
              />
            </div>

            {/* Transaction Type */}
            <div className="grid gap-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as TransactionType)}
                disabled={loading || success}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="restock">Restock (Receiving)</SelectItem>
                  <SelectItem value="damage">Damage/Loss</SelectItem>
                  <SelectItem value="initial">Initial Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this adjustment is being made..."
                required
                disabled={loading || success}
                rows={2}
              />
            </div>

            {/* Reference ID */}
            <div className="grid gap-2">
              <Label htmlFor="reference-id">Reference ID (Optional)</Label>
              <Input
                id="reference-id"
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="PO number, ticket #, etc."
                disabled={loading || success}
              />
            </div>

            {/* Warning for negative stock */}
            {newInventoryCount < 0 && parseInt(quantity) > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This adjustment will result in negative stock ({newInventoryCount}). This
                  will be rejected by the system.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-400">
                  Inventory adjusted successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="p-6 pt-4 border-t bg-muted/50 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || success}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success || newInventoryCount < 0}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adjusting...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Success!
                </>
              ) : (
                'Adjust Inventory'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
