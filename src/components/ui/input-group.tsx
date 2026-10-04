'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// shadcn `input-group` (base-nova), enxuto: sem Textarea (não usamos) e com
// alvo de toque de 44px, igual ao Button/Input do projeto. Não foi instalado
// pela CLI porque ela sobrescreve button.tsx e input.tsx, que já foram
// ajustados pro projeto.

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        // Inválido: borda de 2px (1px de borda + 1px de anel interno), sem mexer no layout.
        'group/input-group relative flex h-11 w-full min-w-0 items-center rounded-lg border border-input bg-field transition-colors outline-none has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-1 has-[[data-slot][aria-invalid=true]]:ring-inset has-[[data-slot][aria-invalid=true]]:ring-destructive has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5',
        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  'flex h-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground select-none group-has-disabled/input-group:opacity-50 group-has-[[aria-invalid=true]]/input-group:text-destructive-strong [&>svg:not([class*="size-"])]:size-4',
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-3',
        'inline-end': 'order-last pr-3',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'type'> & {
  type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <Button
      type={type}
      variant={variant}
      className={cn(
        'h-full w-11 rounded-l-none rounded-r-[calc(var(--radius)-1px)] p-0 text-muted-foreground shadow-none md:h-full md:w-11 md:px-0',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'h-full flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 md:h-full',
        className,
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput }
