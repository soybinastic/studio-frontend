import { useRef, useState, type ChangeEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { canUploadCmsAssets } from '@/lib/cmsAuth'
import { cn } from '@/lib/utils'

interface AssetUploadControlProps {
  accept: string
  disabled?: boolean
  label?: string
  title?: string
  className?: string
  onUpload: (file: File) => Promise<void>
}

export function AssetUploadControl({
  accept,
  disabled,
  label = 'Upload',
  title,
  className,
  onUpload,
}: AssetUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const canUpload = canUploadCmsAssets()
  const isDisabled = disabled || uploading || !canUpload

  const handlePick = () => {
    if (isDisabled) return
    inputRef.current?.click()
  }

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => void handleChange(event)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isDisabled}
        className={cn(className)}
        title={
          title ??
          (canUpload
            ? 'Upload a custom asset'
            : 'CMS authentication required to upload (open studio from CMS)')
        }
        onClick={handlePick}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {uploading ? 'Uploading…' : label}
      </Button>
    </>
  )
}
