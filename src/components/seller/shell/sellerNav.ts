import {
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Package,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react'

export type SellerNavId =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'wallet'
  | 'profile'
  | 'payouts'

// `labelKey` é a chave do texto em `seller.nav` (barra lateral) e em
// `seller.navMobile` (menu do celular, com rótulos mais explícitos).
export const SELLER_NAV: {
  id: SellerNavId
  href: string
  icon: LucideIcon
  labelKey: string
}[] = [
  { id: 'dashboard', href: '/seller', icon: LayoutDashboard, labelKey: 'dashboard' },
  { id: 'sales', href: '/seller/sales', icon: TrendingUp, labelKey: 'sales' },
  { id: 'products', href: '/seller/products', icon: Package, labelKey: 'products' },
  { id: 'wallet', href: '/seller/wallet', icon: Wallet, labelKey: 'wallet' },
  { id: 'profile', href: '/seller/profile', icon: UserRound, labelKey: 'profile' },
  { id: 'payouts', href: '/seller/payouts', icon: Landmark, labelKey: 'payouts' },
]

// O Painel (`/seller`) só vale na rota exata; os demais valem também nas
// subrotas (ex.: /seller/products/new continua em "Produtos").
export function isSellerNavActive(pathname: string, href: string) {
  if (href === '/seller') return pathname === '/seller'
  return pathname === href || pathname.startsWith(`${href}/`)
}
