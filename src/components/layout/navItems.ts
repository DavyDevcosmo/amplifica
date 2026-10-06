// Categorias do catálogo. Os hrefs seguem a convenção de filtro por
// searchParams (`/products?tipo=...`); o catálogo ainda não existe, então o
// parâmetro `tipo` precisa ser confirmado quando `products/page.tsx` sair.
// `key` é a chave do texto em `nav` (src/messages/<locale>/ui.json).
export const MARKET_NAV = [
  { key: 'presets', href: '/products?tipo=preset' },
  { key: 'irs', href: '/products?tipo=ir' },
  { key: 'captures', href: '/products?tipo=capture' },
  { key: 'bundles', href: '/products?tipo=bundle' },
] as const
