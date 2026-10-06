import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

// Campo dos formulários de auth: altura --auth-control-h (52px; 44px em telas baixas), ícone à esquerda, ação opcional à direita.
export function IconInput({
  icon: Icon,
  endAddon,
  ...props
}: React.ComponentProps<'input'> & { icon: LucideIcon; endAddon?: ReactNode }) {
  return (
    <InputGroup className="h-(--auth-control-h)">
      <InputGroupAddon className="pr-1 pl-3.5">
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </InputGroupAddon>
      <InputGroupInput className="md:text-[0.9375rem]" {...props} />
      {endAddon}
    </InputGroup>
  )
}
