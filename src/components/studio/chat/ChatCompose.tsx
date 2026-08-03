import { useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CHAT_MAX_MESSAGE_LENGTH } from '@/types/chat-message'
import { cn } from '@/lib/utils'

interface ChatComposeProps {
  onSend: (message: string) => void
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
  privateRecipientName?: string | null
  onCancelPrivate?: () => void
  className?: string
}

export function ChatCompose({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message…',
  privateRecipientName,
  onCancelPrivate,
  className,
}: ChatComposeProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    onTyping?.(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn('space-y-2 border-t border-border/60 pt-2', className)}>
      {privateRecipientName && (
        <div className="flex items-center justify-between rounded-md bg-violet-500/10 px-2 py-1 text-[10px] text-violet-700 dark:text-violet-300">
          <span>Private to {privateRecipientName}</span>
          {onCancelPrivate && (
            <button type="button" className="underline" onClick={onCancelPrivate}>
              Cancel
            </button>
          )}
        </div>
      )}
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value.slice(0, CHAT_MAX_MESSAGE_LENGTH))
          onTyping?.(e.target.value.length > 0)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="min-h-[4rem] resize-none text-xs"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {value.length}/{CHAT_MAX_MESSAGE_LENGTH}
        </span>
        <Button type="button" size="sm" disabled={disabled || !value.trim()} onClick={handleSend}>
          <Send className="mr-1 h-3.5 w-3.5" />
          Send
        </Button>
      </div>
    </div>
  )
}
