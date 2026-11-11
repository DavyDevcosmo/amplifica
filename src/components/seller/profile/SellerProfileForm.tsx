'use client'

import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState, useTransition } from 'react'
import { updateSellerProfileAction } from '@/actions/sellerActions'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import {
  CARD,
  chipClass,
  H2,
  INPUT,
  SUB,
  TEXTAREA,
} from '@/components/seller/productForm/formStyles'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { PROFILE_DEVICES, sellerProfileSchema } from '@/schemas/sellerSchema'
import { CreatorPreview } from './CreatorPreview'

export type SellerProfileFormValues = {
  displayName: string
  bio: string
  city: string
  devices: string[]
  instagram: string
  youtube: string
  tiktok: string
  spotifyUrl: string
  isFounder: boolean
  imageUrl: string | null
}

const SOCIAL_FIELDS = [
  { key: 'instagram', prefix: '@' },
  { key: 'youtube', prefix: 'youtube.com/@' },
  { key: 'tiktok', prefix: '@' },
  { key: 'spotifyUrl', prefix: null },
] as const

const BIO_MAX = 400

// Perfil público do vendedor: a prévia de "Quem criou este pack" fica no
// topo, em qualquer largura, e acompanha cada tecla dos campos abaixo.
export function SellerProfileForm({ initial }: { initial: SellerProfileFormValues }) {
  const t = useTranslations('seller.profile')
  const translateIssue = useIssueTranslator()
  const id = useId()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  function update(patch: Partial<SellerProfileFormValues>) {
    setValues((current) => ({ ...current, ...patch }))
    setSaved(false)
  }

  function toggleDevice(device: (typeof PROFILE_DEVICES)[number]) {
    // sempre na ordem da lista, para a prévia e o banco ficarem estáveis
    const chosen = new Set(values.devices)
    if (chosen.has(device)) chosen.delete(device)
    else chosen.add(device)
    update({ devices: PROFILE_DEVICES.filter((item) => chosen.has(item)) })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = sellerProfileSchema.safeParse({
      displayName: values.displayName,
      bio: values.bio,
      city: values.city,
      devices: values.devices,
      instagram: values.instagram,
      youtube: values.youtube,
      tiktok: values.tiktok,
      spotifyUrl: values.spotifyUrl,
    })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      setSaved(false)
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await updateSellerProfileAction(parsed.data)
      if (!result.success) {
        setErrors({ form: result.error })
        setSaved(false)
        return
      }
      // mostra o valor já limpo (sem "@" no começo, sem espaços nas pontas)
      setValues((current) => ({
        ...current,
        displayName: parsed.data.displayName,
        bio: parsed.data.bio ?? '',
        city: parsed.data.city ?? '',
        instagram: parsed.data.instagram ?? '',
        youtube: parsed.data.youtube ?? '',
        tiktok: parsed.data.tiktok ?? '',
        spotifyUrl: parsed.data.spotifyUrl ?? '',
      }))
      setSaved(true)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <CreatorPreview
        name={values.displayName}
        bio={values.bio}
        city={values.city}
        devices={values.devices}
        socials={{
          instagram: values.instagram,
          youtube: values.youtube,
          tiktok: values.tiktok,
          spotifyUrl: values.spotifyUrl,
        }}
        isFounder={values.isFounder}
        imageUrl={values.imageUrl}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex max-w-4xl flex-col gap-5"
      >
        <section className={CARD} aria-labelledby={`${id}-identity`}>
          <h2 id={`${id}-identity`} className={H2}>
            {t('identity.title')}
          </h2>

          <AvatarUpload
            variant="pencil"
            user={{ name: values.displayName, image: values.imageUrl }}
            onUploaded={(imageUrl) => update({ imageUrl })}
          />

          <Field data-invalid={!!errors.displayName}>
            <FieldLabel htmlFor={`${id}-name`}>{t('identity.displayName')}</FieldLabel>
            <Input
              id={`${id}-name`}
              name="displayName"
              autoComplete="nickname"
              maxLength={40}
              className={INPUT}
              aria-invalid={!!errors.displayName}
              aria-describedby={`${id}-name-help${errors.displayName ? ` ${id}-name-error` : ''}`}
              value={values.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              disabled={isPending}
            />
            <p id={`${id}-name-help`} className={SUB}>
              {t('identity.displayNameHelp')}
            </p>
            <FieldError id={`${id}-name-error`}>{errors.displayName}</FieldError>
          </Field>

          <Field data-invalid={!!errors.bio}>
            <FieldLabel htmlFor={`${id}-bio`}>{t('identity.bio')}</FieldLabel>
            <Textarea
              id={`${id}-bio`}
              name="bio"
              rows={4}
              maxLength={BIO_MAX}
              className={TEXTAREA}
              aria-invalid={!!errors.bio}
              aria-describedby={`${id}-bio-help${errors.bio ? ` ${id}-bio-error` : ''}`}
              value={values.bio}
              onChange={(e) => update({ bio: e.target.value })}
              disabled={isPending}
            />
            <p id={`${id}-bio-help`} className={SUB}>
              {t('identity.bioHelp', { count: values.bio.length })}
            </p>
            <FieldError id={`${id}-bio-error`}>{errors.bio}</FieldError>
          </Field>

          <Field data-invalid={!!errors.city}>
            <FieldLabel htmlFor={`${id}-city`}>
              {t('identity.city')}{' '}
              <span className="font-normal text-ardosia">{t('optional')}</span>
            </FieldLabel>
            <Input
              id={`${id}-city`}
              name="city"
              autoComplete="address-level2"
              maxLength={60}
              className={INPUT}
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? `${id}-city-error` : undefined}
              value={values.city}
              onChange={(e) => update({ city: e.target.value })}
              disabled={isPending}
            />
            <FieldError id={`${id}-city-error`}>{errors.city}</FieldError>
          </Field>
        </section>

        <section className={CARD} aria-labelledby={`${id}-devices`}>
          <div className="flex flex-col gap-1">
            <h2 id={`${id}-devices`} className={H2}>
              {t('devices.title')}
            </h2>
            <p className={SUB}>{t('devices.text')}</p>
          </div>
          <fieldset
            aria-label={t('devices.group')}
            className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
          >
            {PROFILE_DEVICES.map((device) => {
              const on = values.devices.includes(device)
              return (
                <button
                  key={device}
                  type="button"
                  aria-pressed={on}
                  disabled={isPending}
                  onClick={() => toggleDevice(device)}
                  className={chipClass(on)}
                >
                  {on ? (
                    <CheckIcon className="size-3.5" strokeWidth={2.6} aria-hidden />
                  ) : null}
                  {device}
                </button>
              )
            })}
          </fieldset>
          {errors.devices ? <FieldError>{errors.devices}</FieldError> : null}
        </section>

        <section className={CARD} aria-labelledby={`${id}-socials`}>
          <div className="flex flex-col gap-1">
            <h2 id={`${id}-socials`} className={H2}>
              {t('socials.title')}{' '}
              <span className="font-normal text-ardosia">{t('optional')}</span>
            </h2>
            <p className={SUB}>{t('socials.text')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SOCIAL_FIELDS.map(({ key, prefix }) => (
              <Field key={key} data-invalid={!!errors[key]}>
                <FieldLabel htmlFor={`${id}-${key}`}>
                  {t(`socials.${key === 'spotifyUrl' ? 'spotify' : key}`)}
                </FieldLabel>
                <InputGroup className="h-12 rounded-xl border-[1.5px] border-ardosia/40 bg-card">
                  <InputGroupAddon aria-hidden>
                    {prefix ?? t('socials.spotifyPrefix')}
                  </InputGroupAddon>
                  <InputGroupInput
                    id={`${id}-${key}`}
                    name={key}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode={key === 'spotifyUrl' ? 'url' : undefined}
                    placeholder={
                      key === 'spotifyUrl'
                        ? t('socials.spotifyPlaceholder')
                        : t('socials.placeholder')
                    }
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
                    value={values[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    disabled={isPending}
                  />
                </InputGroup>
                <FieldError id={`${id}-${key}-error`}>{errors[key]}</FieldError>
              </Field>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="xl" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? t('saving') : t('save')}
          </Button>
          {saved ? (
            <span
              role="status"
              className="inline-flex items-center gap-2 text-sm font-semibold text-success"
            >
              <CheckIcon className="size-4" strokeWidth={2.4} aria-hidden />
              {t('saved')}
            </span>
          ) : null}
          {errors.form ? <FieldError>{errors.form}</FieldError> : null}
        </div>
      </form>
    </div>
  )
}
