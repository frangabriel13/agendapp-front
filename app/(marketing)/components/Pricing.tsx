import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { cardSurface } from "../ui/Card"
import { CtaLink } from "../ui/CtaLink"
import { Glow } from "../ui/Glow"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

type Tone = "default" | "highlight" | "dark"

interface Plan {
  name: string
  description: string
  price: string
  priceNote: string
  /** Precio tachado y descuento van juntos: o están los dos o no está ninguno. */
  discount?: { from: string; off: string }
  features: string[]
  cta: { label: string; href: string }
  tone: Tone
  tag?: string
}

const plans: Plan[] = [
  {
    name: "Básico",
    description: "Para empezar",
    price: "$25.000",
    priceNote: "ARS / mes",
    discount: { from: "$35.000", off: "28% OFF" },
    features: ["1 profesional", "1 sucursal", "Agenda ilimitada", "Ficha clínica digital", "Soporte incluido"],
    cta: { label: "Empezar gratis", href: "/login" },
    tone: "default",
  },
  {
    name: "Pro",
    description: "El más elegido",
    price: "$45.000",
    priceNote: "ARS / mes",
    discount: { from: "$65.000", off: "30% OFF" },
    features: [
      "Hasta 3 profesionales",
      "1 sucursal",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte incluido",
    ],
    cta: { label: "Empezar gratis", href: "/login" },
    tone: "highlight",
    tag: "Más popular",
  },
  {
    name: "Avanzado",
    description: "Para clínicas en crecimiento",
    price: "$80.000",
    priceNote: "ARS / mes",
    discount: { from: "$110.000", off: "27% OFF" },
    features: [
      "Hasta 6 profesionales",
      "Hasta 2 sucursales",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte prioritario",
    ],
    cta: { label: "Empezar gratis", href: "/login" },
    tone: "default",
  },
  {
    name: "Business",
    description: "Para grandes equipos",
    price: "A consultar",
    priceNote: "precio según el negocio",
    features: [
      "Profesionales ilimitados",
      "Sucursales ilimitadas",
      "Configuración personalizada",
      "Soporte dedicado",
      "Capacitación incluida",
    ],
    cta: { label: "Hablar con el equipo", href: "#contacto" },
    tone: "dark",
    tag: "A medida",
  },
]

export function Pricing() {
  return (
    <Section id="pricing">
      <Glow className="left-1/2 top-24 h-[26rem] w-[52rem] -translate-x-1/2 bg-violet-400/15" />

      <SectionHeading
        badge="Precio de lanzamiento"
        title={
          <>
            Simple y sin sorpresas,
            <br className="hidden sm:inline" /> para cada tamaño
          </>
        }
        subtitle="Elegí el plan que se adapta a tu estética. Cancelás cuando quieras."
        className="mb-14"
      />

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <p className={`${cardSurface} max-w-xl px-5 py-4 text-[13px] leading-relaxed text-neutral-500`}>
          <span className="font-medium text-neutral-900">Recordatorios por WhatsApp</span> — add-on disponible en todos
          los planes. Se cobra por mensaje enviado.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        No necesitás tarjeta de crédito para empezar
      </p>
    </Section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const dark = plan.tone === "dark"

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-6",
        plan.tone === "default" && cardSurface,
        plan.tone === "highlight" &&
          "border border-violet-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_50px_-24px_rgba(124,58,237,0.55)] lg:-mt-4 lg:pb-10",
        dark && "border border-white/10 bg-neutral-950",
      )}
    >
      {plan.tag && (
        <span
          className={cn(
            "absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
            plan.tone === "highlight" ? "bg-violet-600 text-white" : "bg-white/10 text-white",
          )}
        >
          {plan.tag}
        </span>
      )}

      <p className={cn("text-[13px]", dark ? "text-neutral-400" : "text-neutral-500")}>{plan.description}</p>
      <p className={cn("mt-1 text-lg font-semibold tracking-tight", dark ? "text-white" : "text-neutral-900")}>
        {plan.name}
      </p>

      {/* Reserva la línea del descuento también cuando no hay, para que los
          precios de las cuatro tarjetas queden alineados entre sí. */}
      <div className="mt-5 flex h-6 items-baseline gap-2">
        {plan.discount && (
          <>
            <span className="text-[15px] text-neutral-400 line-through">{plan.discount.from}</span>
            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {plan.discount.off}
            </span>
          </>
        )}
      </div>

      <p
        className={cn(
          "mt-1 font-semibold tracking-tight",
          dark ? "text-2xl text-white" : "text-[2.25rem] leading-none text-neutral-900",
        )}
      >
        {plan.price}
      </p>
      <p className={cn("mt-1.5 text-xs", dark ? "text-neutral-500" : "text-neutral-400")}>{plan.priceNote}</p>

      <ul className="mt-6 mb-8 flex-1 space-y-3">
        {plan.features.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check size={15} className={cn("mt-0.5 shrink-0", dark ? "text-violet-400" : "text-violet-600")} />
            <span className={cn("text-[13px]", dark ? "text-neutral-300" : "text-neutral-600")}>{item}</span>
          </li>
        ))}
      </ul>

      <CtaLink
        href={plan.cta.href}
        block
        variant={plan.tone === "highlight" ? "violet" : dark ? "light" : "subtle"}
        className="mt-auto"
      >
        {plan.cta.label}
      </CtaLink>
    </div>
  )
}
