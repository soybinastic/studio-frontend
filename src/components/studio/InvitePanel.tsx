import { Check, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { copyToClipboard } from '@/lib/utils'

interface InvitePanelProps {
  inviteUrl: string
  className?: string
}

export function InvitePanel({ inviteUrl, className }: InvitePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(inviteUrl)
    if (ok) {
      setCopied(true)
      toast.success('Invite link copied')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className={className}>
      <Label htmlFor="invite-url" className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Link2 className="h-3.5 w-3.5" />
        Guest invite link
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id="invite-url" readOnly value={inviteUrl} className="min-w-0 flex-1 font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" className="touch-target shrink-0" onClick={handleCopy} aria-label="Copy invite link">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
