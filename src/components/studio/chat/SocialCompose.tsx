import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { SocialDestinationSummary, SocialSendTarget } from '@/api/studioChat'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_MESSAGE_LENGTH = 500
const CHAR_COUNT_THRESHOLD = Math.floor(MAX_MESSAGE_LENGTH * 0.8)
const CHIP_DESTINATION_THRESHOLD = 3

const PLATFORM_LABELS = {
  youtube: 'YouTube',
  twitch: 'Twitch',
} as const

interface SocialComposeProps {
  destinations: SocialDestinationSummary[]
  disabled?: boolean
  sending?: boolean
  onSend: (platform: SocialSendTarget, message: string) => Promise<void>
  className?: string
}

function destinationLabel(destination: SocialDestinationSummary): string {
  const platformLabel = PLATFORM_LABELS[destination.platform]
  const account = destination.accountName?.trim()
  return account ? `${platformLabel} (${account})` : platformLabel
}

function DestinationChips({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ value: SocialSendTarget; label: string }>
  value: SocialSendTarget
  onChange: (next: SocialSendTarget) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? 'secondary' : 'ghost'}
          className="h-7 rounded-full px-2.5 text-[10px]"
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export function SocialCompose({
  destinations,
  disabled = false,
  sending = false,
  onSend,
  className,
}: SocialComposeProps) {
  const [value, setValue] = useState('')
  const [platform, setPlatform] = useState<SocialSendTarget>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const platformOptions = useMemo(() => {
    const items = destinations.map((destination) => ({
      value: destination.platform as SocialSendTarget,
      label: destinationLabel(destination),
    }))
    if (items.length > 1) {
      return [{ value: 'all' as const, label: 'All' }, ...items]
    }
    return items
  }, [destinations])

  useEffect(() => {
    if (platformOptions.length === 0) {
      setPlatform('all')
      return
    }
    if (platform === 'all' && platformOptions.length === 1) {
      setPlatform(platformOptions[0].value)
      return
    }
    const stillValid = platformOptions.some((option) => option.value === platform)
    if (!stillValid) {
      setPlatform(platformOptions[0]?.value ?? 'all')
    }
  }, [platform, platformOptions])

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  const handleSend = async () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || sending || destinations.length === 0) {
      return
    }
    await onSend(platform, trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const composeDisabled = disabled || sending || destinations.length === 0
  const showCharCount = value.length >= CHAR_COUNT_THRESHOLD
  const useChipDestinations = platformOptions.length <= CHIP_DESTINATION_THRESHOLD

  return (
    <div className={cn('shrink-0 space-y-2 border-t border-border/60 pt-2', className)}>
      {destinations.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Connect YouTube or Twitch while live to send messages to social chat.
        </p>
      ) : null}

      {useChipDestinations && platformOptions.length > 1 ? (
        <DestinationChips
          options={platformOptions}
          value={platform}
          onChange={setPlatform}
          disabled={composeDisabled}
        />
      ) : null}

      <div className="flex items-end gap-2">
        {!useChipDestinations && platformOptions.length > 0 ? (
          <Select
            value={platform}
            onValueChange={(next) => setPlatform(next as SocialSendTarget)}
            disabled={composeDisabled || platformOptions.length <= 1}
          >
            <SelectTrigger className="h-9 w-[8.5rem] shrink-0 text-xs" aria-label="Social destination">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Reply to social chat…"
          disabled={composeDisabled}
          rows={1}
          className="min-h-[2.25rem] max-h-24 flex-1 resize-none py-2 text-xs leading-snug"
          aria-label="Social chat message"
        />

        <Button
          type="button"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={composeDisabled || !value.trim()}
          onClick={() => void handleSend()}
          aria-label="Send social message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showCharCount && (
        <p className="text-[10px] text-muted-foreground">
          {value.length}/{MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  )
}
