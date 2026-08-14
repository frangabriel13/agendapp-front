import { cn } from "@/lib/utils"

/** Chip que rotula la sección. Va siempre arriba del título. */
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white",
        "px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-600",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-violet-500" />
      {children}
    </span>
  )
}
