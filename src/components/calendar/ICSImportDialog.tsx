'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ICSImportDialogProps {
  onImportComplete?: () => void
}

export function ICSImportDialog({ onImportComplete }: ICSImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; imported?: number; error?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.ics') && !selectedFile.type.includes('calendar')) {
        toast.error('Please select a valid ICS file')
        return
      }
      setFile(selectedFile)
      // Auto-fill name from filename if empty
      if (!name) {
        setName(selectedFile.name.replace('.ics', ''))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.ics')) {
        toast.error('Please drop a valid ICS file')
        return
      }
      setFile(droppedFile)
      if (!name) {
        setName(droppedFile.name.replace('.ics', ''))
      }
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      // Read file content
      const content = await file.text()

      // Send to API
      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || file.name.replace('.ics', ''),
          icsContent: content,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, imported: data.imported })
        toast.success(`Imported ${data.imported} events`)
        onImportComplete?.()
      } else {
        setResult({ success: false, error: data.error })
        toast.error(data.error || 'Import failed')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Import failed'
      setResult({ success: false, error: errorMsg })
      toast.error(errorMsg)
    } finally {
      setImporting(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setName('')
    setResult(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import ICS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Calendar</DialogTitle>
          <DialogDescription>
            Upload an ICS file to import events into your calendar
          </DialogDescription>
        </DialogHeader>

        {result?.success ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Import Complete</h3>
            <p className="text-muted-foreground mt-1">
              Successfully imported {result.imported} events
            </p>
            <Button onClick={resetDialog} className="mt-4">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendarName">Calendar Name</Label>
              <Input
                id="calendarName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work Calendar"
              />
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Drop your ICS file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </>
              )}
            </div>

            {result?.error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{result.error}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ICSImportDialog
