import { cn } from "@/lib/utils"
import { Badge } from "./Badge"

interface Props {
  badge?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: "center" | "left"
  className?: string
}

/** Chip + título + bajada. El encabezado se repite igual en todas las secciones. */
export function SectionHeading({ badge, title, subtitle, align = "center", className }: Props) {
  const centered = align === "center"

  return (
    <div className={cn(centered && "text-center", className)}>
      {badge && <Badge>{badge}</Badge>}
      <h2
        className={cn(
          "text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-neutral-900 md:text-[2.5rem]",
          badge && "mt-5",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-pretty text-[15px] leading-relaxed text-neutral-500",
            centered && "mx-auto max-w-xl",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
