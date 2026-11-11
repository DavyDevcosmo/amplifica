'use client'

import { PauseIcon, PlayIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Player da prévia em áudio (faixa noite): play/pausa sobre um <audio> com a
// URL pública do arquivo. Sem URL (bucket público desligado) o botão fica
// desabilitado e só o nome aparece.
export function PreviewPlayer({
  url,
  fileName,
  detail,
}: {
  url: string | null
  fileName: string
  detail?: string
}) {
  const t = useTranslations('seller.productForm.files')
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      )
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-tile bg-noite p-4 text-white">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={t(playing ? 'pause' : 'play')}
        aria-pressed={playing}
        className={cn(
          'grid size-11 flex-none place-items-center rounded-full bg-azul text-white outline-none hover:bg-azul-forte focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-noite disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {playing ? (
          <PauseIcon aria-hidden className="size-4 fill-current" />
        ) : (
          <PlayIcon aria-hidden className="size-4 fill-current" />
        )}
      </button>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[0.8125rem] font-semibold">{fileName}</span>
        {detail ? <span className="text-xs text-celeste">{detail}</span> : null}
      </span>
      {url ? (
        // biome-ignore lint/a11y/useMediaCaption: prévia instrumental, sem fala
        <audio
          ref={audioRef}
          src={url}
          preload="none"
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          className="hidden"
        />
      ) : null}
    </div>
  )
}
