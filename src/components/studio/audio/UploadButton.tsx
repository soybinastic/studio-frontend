import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadButtonProps {
  disabled?: boolean
  className?: string
}

export function UploadButton({ disabled = true, className }: UploadButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={className}
      title="Upload coming soon — select a preset track for now"
    >
      <Upload className="h-3.5 w-3.5" />
      Upload
    </Button>
  )
}
