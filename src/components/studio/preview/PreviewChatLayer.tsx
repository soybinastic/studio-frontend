import type { ChatGraphic } from '@/types/graphics'
import { chatPreviewStyle } from '@/lib/chatGeometry'

interface PreviewChatLayerProps {
  chat: ChatGraphic
}

function formatOverlayLine(message: ChatGraphic['messages'][number]): string {
  const text = message.text ?? message.message ?? ''
  if (message.author?.trim()) {
    return `${message.author}: ${text}`
  }
  return text
}

export function PreviewChatLayer({ chat }: PreviewChatLayerProps) {
  const lines = (chat.messages ?? []).slice(-20)

  return (
    <div
      className="absolute overflow-hidden rounded-sm bg-[rgb(10,10,14)]/70 p-2"
      style={chatPreviewStyle()}
      aria-hidden
    >
      {lines.length === 0 ? (
        <p className="text-[9px] text-white/50">Waiting for social comments…</p>
      ) : (
        <div className="flex flex-col gap-1">
          {lines.map((message, index) => (
            <p
              key={`${message.author}-${index}`}
              className="truncate text-[9px] leading-tight text-white/90"
              title={formatOverlayLine(message)}
            >
              {formatOverlayLine(message).slice(0, 120)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
