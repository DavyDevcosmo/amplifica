// Ícones de rede social em traço (o lucide 1.x não tem mais ícones de marca).
// Decorativos: quem os usa dá o aria-label no link.
type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: 'false',
} as const

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...base} aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg {...base} aria-hidden className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
    </svg>
  )
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg {...base} aria-hidden className={className}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.5 2.8 2.3 4.5 5 4.8" />
    </svg>
  )
}

export function SpotifyIcon({ className }: IconProps) {
  return (
    <svg {...base} aria-hidden className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 9.5c3-1 6.5-.7 9 .8" />
      <path d="M8 12.5c2.5-.7 5.2-.4 7.3.8" />
      <path d="M8.5 15.3c2-.5 4-.3 5.6.6" />
    </svg>
  )
}

// Redes que a loja mostra no bloco "Quem criou este pack" (nome + ícone),
// compartilhado entre a página do produto e a prévia do perfil do vendedor.
export const SOCIAL_NETWORKS = {
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  youtube: { label: 'YouTube', Icon: YoutubeIcon },
  tiktok: { label: 'TikTok', Icon: TiktokIcon },
  spotify: { label: 'Spotify', Icon: SpotifyIcon },
} as const
