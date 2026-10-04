import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // avatares enviados pro R2 (upload direto do usuário)
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
      // foto de perfil do Google, quando o login é via OAuth
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default withNextIntl(nextConfig)
