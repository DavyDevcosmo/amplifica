import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { InstagramIcon, YoutubeIcon } from '@/components/layout/SocialIcons'

// Páginas institucionais (sobre, contato, ajuda, termos...) ainda não existem;
// os links já apontam pras rotas planejadas. Perfis sociais: trocar pelos
// endereços oficiais quando existirem.
const SOCIAL = [
  { key: 'instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
  { key: 'youtube', href: 'https://www.youtube.com/', Icon: YoutubeIcon },
] as const

const GROUPS = [
  {
    key: 'company',
    links: [
      { key: 'about', href: '/sobre' },
      { key: 'becomeSeller', href: '/sell' },
      { key: 'contact', href: '/contato' },
    ],
  },
  {
    key: 'help',
    links: [
      { key: 'howItWorks', href: '/sell#como-funciona' },
      { key: 'refunds', href: '/reembolsos' },
      { key: 'helpCenter', href: '/ajuda' },
    ],
  },
  {
    key: 'legal',
    links: [
      { key: 'terms', href: '/termos' },
      { key: 'privacy', href: '/privacidade' },
      { key: 'refundPolicy', href: '/politica-de-reembolso' },
    ],
  },
] as const

const linkFocus =
  'outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-noite'

export async function SiteFooter() {
  const t = await getTranslations('footer')
  const tNav = await getTranslations('nav')

  return (
    <footer className="bg-noite text-white">
      <div className="mx-auto flex max-w-340 flex-col gap-10 px-4 pt-16 pb-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <span className="font-display text-2xl leading-none">Amplifica</span>
            <p className="max-w-[34ch] text-sm leading-[1.375rem] text-celeste">
              {t('tagline')}
            </p>
            <div className="flex gap-4.5 p-1.5">
              {SOCIAL.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  aria-label={t(key)}
                  target="_blank"
                  rel="noreferrer"
                  className={`grid size-12 place-items-center rounded-full bg-creme text-preto shadow-[0_0_0_6px_rgb(37_99_235/0.45)] ${linkFocus}`}
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {GROUPS.map((group) => (
            <nav
              key={group.key}
              aria-label={t(group.key)}
              className="flex flex-col gap-0.5"
            >
              <p className="mb-2 type-eyebrow text-celeste">{t(group.key)}</p>
              {group.links.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className={`self-start rounded-sm text-sm leading-[2.125rem] hover:text-celeste ${linkFocus}`}
                >
                  {link.key === 'becomeSeller' ? tNav('becomeSeller') : t(link.key)}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-celeste/30 pt-5">
          <p className="text-[0.8125rem] leading-[1.125rem] text-celeste">
            {t('legalLine')}
          </p>
          <p className="text-[0.8125rem] leading-[1.125rem] text-celeste">
            {t('stripe')}
          </p>
        </div>
      </div>
    </footer>
  )
}
