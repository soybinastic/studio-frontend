import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Lock, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CHAT_MAX_MESSAGE_LENGTH } from '@/types/chat-message'
import { cn } from '@/lib/utils'

export interface ChatComposeHandle {
  focus: () => void
}

interface ChatComposeProps {
  onSend: (message: string) => void
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
  privateRecipientName?: string | null
  onCancelPrivate?: () => void
  onStartPrivate?: () => void
  showPrivateShortcut?: boolean
  privateShortcutLabel?: string
  className?: string
}

const CHAR_COUNT_THRESHOLD = Math.floor(CHAT_MAX_MESSAGE_LENGTH * 0.8)

export const ChatCompose = forwardRef<ChatComposeHandle, ChatComposeProps>(function ChatCompose(
  {
    onSend,
    onTyping,
    disabled = false,
    placeholder = 'Type a message…',
    privateRecipientName,
    onCancelPrivate,
    onStartPrivate,
    showPrivateShortcut = false,
    privateShortcutLabel,
    className,
  },
  ref,
) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  useEffect(() => {
    if (privateRecipientName) {
      textareaRef.current?.focus()
    }
  }, [privateRecipientName])

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    onTyping?.(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const showCharCount = value.length >= CHAR_COUNT_THRESHOLD

  return (
    <div className={cn('shrink-0 space-y-2 border-t border-border/60 pt-2', className)}>
      {privateRecipientName ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[11px] text-violet-700 dark:text-violet-300">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            Private to {privateRecipientName}
          </span>
          {onCancelPrivate && (
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 hover:bg-violet-500/10"
              onClick={onCancelPrivate}
              aria-label="Cancel private message"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      ) : showPrivateShortcut && onStartPrivate ? (
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-700 dark:hover:text-violet-300"
          disabled={disabled}
          onClick={onStartPrivate}
        >
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          {privateShortcutLabel ?? 'Send a private message'}
        </button>
      ) : null}

      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.slice(0, CHAT_MAX_MESSAGE_LENGTH))
            onTyping?.(e.target.value.length > 0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[2.25rem] max-h-24 resize-none py-2 text-xs leading-snug"
          aria-label="Chat message"
        />
        <Button
          type="button"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={disabled || !value.trim()}
          onClick={handleSend}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {showCharCount && (
        <p className="text-[10px] text-muted-foreground">
          {value.length}/{CHAT_MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  )
})
