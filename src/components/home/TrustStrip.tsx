import { DownloadIcon, HeadphonesIcon, LockIcon, RotateCcwIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { SELLER_RULES } from '@/components/seller/sellerEarnings'

// Faixa marinho de garantias logo abaixo do hero.
export async function TrustStrip() {
  const t = await getTranslations('home.trust')

  const items = [
    {
      key: 'listen',
      Icon: HeadphonesIcon,
      title: t('listenTitle'),
      text: t('listenText'),
    },
    {
      key: 'download',
      Icon: DownloadIcon,
      title: t('downloadTitle'),
      text: t('downloadText'),
    },
    {
      key: 'refund',
      Icon: RotateCcwIcon,
      title: t('refundTitle', { days: SELLER_RULES.refundWindowDays }),
      text: t('refundText'),
    },
    { key: 'secure', Icon: LockIcon, title: t('secureTitle'), text: t('secureText') },
  ]

  return (
    <section aria-label={t('label')} className="bg-marinho text-white">
      <ul className="mx-auto grid max-w-340 gap-x-6 gap-y-4 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {items.map(({ key, Icon, title, text }) => (
          <li key={key} className="flex items-center gap-4">
            <span className="grid size-13 shrink-0 place-items-center rounded-tile border border-white/45">
              <Icon aria-hidden strokeWidth={1.6} className="size-5.5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <strong className="text-xs leading-4 font-semibold tracking-[0.12em] uppercase">
                {title}
              </strong>
              <span className="text-[0.8125rem] leading-[1.125rem] text-gelo">
                {text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
