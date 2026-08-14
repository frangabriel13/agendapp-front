import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { cardSurface } from "../ui/Card"
import { CtaLink } from "../ui/CtaLink"
import { Glow } from "../ui/Glow"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"

interface Plan {
  name: string
  description: string
  price: string
  period: string
  discount?: { from: string; off: string }
  features: string[]
  featured?: boolean
  tag?: string
}

const plans: Plan[] = [
  {
    name: "Básico",
    description: "Para empezar",
    price: "$25.000",
    period: "ARS / mes",
    discount: { from: "$35.000", off: "28% OFF" },
    features: ["1 profesional", "1 sucursal", "Agenda ilimitada", "Ficha clínica digital", "Soporte incluido"],
  },
  {
    name: "Pro",
    description: "El más elegido",
    price: "$45.000",
    period: "ARS / mes",
    discount: { from: "$65.000", off: "30% OFF" },
    features: [
      "Hasta 3 profesionales",
      "1 sucursal",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte incluido",
    ],
    featured: true,
    tag: "Más elegido",
  },
  {
    name: "Avanzado",
    description: "Para clínicas en crecimiento",
    price: "$80.000",
    period: "ARS / mes",
    discount: { from: "$110.000", off: "27% OFF" },
    features: [
      "Hasta 6 profesionales",
      "Hasta 2 sucursales",
      "Agenda ilimitada",
      "Control de equipos",
      "Ficha clínica digital",
      "Soporte prioritario",
    ],
  },
]

const businessFeatures = [
  "Profesionales ilimitados",
  "Sucursales ilimitadas",
  "Configuración personalizada",
  "Soporte dedicado",
  "Capacitación incluida",
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      <BusinessBanner />

      <div className="mt-6 flex justify-center">
        <p className={`${cardSurface} max-w-xl px-5 py-4 text-[13px] leading-relaxed text-neutral-500`}>
          <span className="font-medium text-neutral-900">Recordatorios por WhatsApp</span> — add-on disponible en todos
          los planes. Se cobra por mensaje enviado.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">No necesitás tarjeta de crédito para empezar</p>
    </Section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-6",
        plan.featured
          ? // Sube y baja del resto de la fila para que se lea como el recomendado.
            "border-violet-300 bg-linear-to-b from-violet-50 to-white shadow-[0_24px_50px_-24px_rgba(124,58,237,0.5)] lg:-my-4 lg:py-10"
          : "border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-semibold tracking-tight text-neutral-900">{plan.name}</p>
        {plan.tag && (
          <span className="shrink-0 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            {plan.tag}
          </span>
        )}
      </div>

      {/* Alto fijo de dos renglones: sin esto las descripciones de distinto largo
          desalinean el divisor y el precio entre las tres tarjetas. */}
      <p className="mt-1.5 min-h-9 text-[13px] leading-[1.4] text-neutral-500">{plan.description}</p>

      <Divider />

      <div>
        <p className="flex items-baseline gap-1.5">
          <span className="text-[2.125rem] font-semibold leading-none tracking-tight text-neutral-900">
            {plan.price}
          </span>
          <span className="text-[13px] text-neutral-400">{plan.period}</span>
        </p>
        {/* La fila se reserva aunque no haya descuento, así los divisores de las
            tres tarjetas caen a la misma altura. */}
        <p className="mt-2.5 flex h-5 items-center gap-2">
          {plan.discount && (
            <>
              <span className="text-[13px] text-neutral-400 line-through">{plan.discount.from}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                {plan.discount.off}
              </span>
            </>
          )}
        </p>
      </div>

      <Divider />

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check size={14} className="mt-[3px] shrink-0 text-violet-600" />
            <span className="text-[13px] leading-snug text-neutral-600">{item}</span>
          </li>
        ))}
      </ul>

      <CtaLink href="/login" variant={plan.featured ? "violet" : "subtle"} block className="mt-auto">
        Empezar gratis
      </CtaLink>
    </div>
  )
}

function Divider() {
  return <div aria-hidden className="my-5 h-px bg-black/[0.07]" />
}

/**
 * Business no entra en la grilla: no tiene precio con qué compararse y sumaba una
 * cuarta columna que angostaba a las otras tres. Va como franja aparte, con la
 * acción que de verdad lo diferencia — hablar con alguien en vez de contratar.
 */
function BusinessBanner() {
  return (
    <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-black/[0.07] bg-neutral-50 p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">Business</p>
          <span className="rounded-full bg-neutral-200/70 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
            A medida
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
          ¿Más de 6 profesionales o más de 2 sucursales? Armamos el plan según cómo trabaja tu equipo.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {businessFeatures.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-[13px] text-neutral-600">
              <Check size={14} className="shrink-0 text-violet-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 md:text-right">
        <p className="text-[13px] text-neutral-400">Precio a consultar</p>
        <CtaLink href="#contacto" className="mt-3">
          Hablar con soporte
        </CtaLink>
      </div>
    </div>
  )
}
