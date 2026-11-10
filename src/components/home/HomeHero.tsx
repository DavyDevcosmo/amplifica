import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import heroImage from '../../../public/images/home-hero.webp'

// Hero da home (v4): fundo noite com um brilho azul atrás da foto do
// equipamento, título em Archivo expandida à esquerda. Sem botões: o catálogo
// começa logo abaixo das garantias.
export async function HomeHero() {
  const t = await getTranslations('home.hero')

  return (
    <section
      aria-labelledby="hero-titulo"
      className="relative overflow-hidden bg-noite bg-[radial-gradient(60%_70%_at_78%_45%,rgb(37_99_235/0.38)_0%,rgb(37_99_235/0)_70%)] text-white"
    >
      <div className="mx-auto grid max-w-340 items-center gap-x-12 gap-y-6 px-4 pt-10 lg:min-h-160 lg:grid-cols-[6fr_5fr] lg:px-8 lg:pt-14">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <h1
            id="hero-titulo"
            className="font-display text-[2.125rem] leading-[1.04] lg:text-6xl"
          >
            {t('title')} <span className="text-azul-claro">{t('titleAccent')}</span>
          </h1>
          <p className="max-w-[42ch] text-base leading-[1.55] text-nevoa lg:text-lg">
            {t('lead')}
          </p>
        </div>

        <div className="relative z-0 flex items-end justify-center self-stretch">
          <div
            aria-hidden
            className="absolute bottom-[8%] left-1/2 aspect-square w-[82%] -translate-x-1/2 rounded-full bg-radial from-azul/40 to-azul/0 to-70%"
          />
          <Image
            src={heroImage}
            alt={t('imageAlt')}
            priority
            sizes="(min-width: 1024px) 500px, 320px"
            className="relative h-auto w-full max-w-80 lg:max-w-125"
          />
        </div>
      </div>
    </section>
  )
}
