import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Estilos de los botones de acción, compartidos por landing y auth.
 *
 * El `cva` se exporta aparte del componente porque no todo botón es un enlace:
 * el submit de un formulario tiene que ser un `<button>`. Sin esto, cada
 * formulario recopia las clases a mano y el primario deja de ser uno solo.
 */
export const cta = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
    "disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        dark: "bg-neutral-900 text-white hover:bg-neutral-700",
        violet: "bg-violet-600 text-white hover:bg-violet-500",
        outline: "border border-black/10 bg-white text-neutral-700 hover:border-black/20 hover:text-neutral-900",
        light: "bg-white text-neutral-900 hover:bg-neutral-100",
        subtle: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
      },
      size: {
        sm: "px-4 py-2 text-[13px]",
        md: "px-6 py-2.5 text-sm",
        lg: "px-7 py-3 text-[15px]",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
)

type Props = VariantProps<typeof cta> & {
  href: string
  className?: string
  children: React.ReactNode
}

/**
 * Botón-enlace.
 *
 * Las anclas de la misma página van con `<a>`: `Link` está para navegar entre
 * rutas y en un `#hash` no aporta nada.
 */
export function CtaLink({ href, variant, size, block, className, children }: Props) {
  const classes = cn(cta({ variant, size, block }), className)

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
