// Navegação principal da loja (cabeçalho e menu mobile). `key` é a chave do
// texto em `nav` (src/messages/<locale>/ui.json). Enquanto o catálogo
// (`/products`) não existe, Presets e Pedaleiras apontam pras seções da home.
export const STORE_NAV = [
  { key: 'presets', href: '/#catalogo' },
  { key: 'pedalboards', href: '/#pedaleiras' },
  { key: 'howItWorks', href: '/sell#como-funciona' },
  { key: 'becomeSeller', href: '/sell' },
] as const
