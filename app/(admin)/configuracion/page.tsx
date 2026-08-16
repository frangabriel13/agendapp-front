"use client"

import { RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { Page, PageHeader } from "../ui/Page"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { BookingSection } from "@/features/tenants/components/BookingSection"
import { BrandingSection } from "@/features/tenants/components/BrandingSection"
import { BusinessSection } from "@/features/tenants/components/BusinessSection"
import { useBranding, useSettings, useTenant } from "@/features/tenants/hooks/useTenant"
import { SUBSCRIPTION_LABELS } from "@/features/tenants/lib/options"
import type { Tenant } from "@/types"

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const tenant = useTenant()
  const branding = useBranding()
  const settings = useSettings()

  const manage = canManage(session?.employee.role)
  const cargando = tenant.isPending || branding.isPending || settings.isPending
  const error = tenant.error ?? branding.error ?? settings.error

  return (
    <Page width="narrow">
      <PageHeader
        title="Configuración"
        description={
          manage
            ? "Los datos de tu negocio y cómo funcionan las reservas."
            : "Los datos de tu negocio. Solo un administrador puede cambiarlos."
        }
      />

      <div className="space-y-4">
        {cargando && <SectionsSkeleton />}

        {!cargando && error && (
          <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No pudimos cargar la configuración</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
              {apiErrorMessage(error, "Revisá tu conexión y probá de nuevo.")}
            </p>
            <button
              type="button"
              onClick={() => {
                tenant.refetch()
                branding.refetch()
                settings.refetch()
              }}
              className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
            >
              <RotateCw size={15} />
              Reintentar
            </button>
          </div>
        )}

        {/*
          Cada sección se monta con su dato ya cargado y arranca su estado desde
          las props, así no hace falta un efecto que copie datos a estado.
        */}
        {!cargando && !error && tenant.data && <PlanCard tenant={tenant.data} />}
        {!cargando && !error && tenant.data && <BusinessSection tenant={tenant.data} canSave={manage} />}
        {!cargando && !error && branding.data && <BrandingSection branding={branding.data} canSave={manage} />}
        {!cargando && !error && settings.data && <BookingSection settings={settings.data} canSave={manage} />}
      </div>
    </Page>
  )
}

function PlanCard({ tenant }: { tenant: Tenant }) {
  const { plan } = tenant
  const limite = (valor: number | null) => (valor === null ? "Sin límite" : String(valor))

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-neutral-500">Plan contratado</p>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">{plan.name}</p>
        </div>
        <span className="rounded-full border border-black/[0.07] bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
          {SUBSCRIPTION_LABELS[tenant.subscriptionStatus] ?? tenant.subscriptionStatus}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Dato label="Profesionales" valor={limite(plan.maxEmployees)} />
        <Dato label="Sucursales" valor={limite(plan.maxBranches)} />
        <Dato label="Ficha clínica" valor={plan.includesClinicRecords ? "Incluida" : "No incluida"} />
        <Dato label="Soporte" valor={plan.supportLevel === "PRIORITY" ? "Prioritario" : "Estándar"} />
      </dl>

      {tenant.trialEndsAt && tenant.subscriptionStatus === "TRIAL" && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800">
          La prueba termina el{" "}
          {new Date(tenant.trialEndsAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      )}
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="text-[13px] font-medium text-neutral-900">{valor}</dd>
    </div>
  )
}

function SectionsSkeleton() {
  return (
    <>
      {[110, 320, 340].map((alto, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-neutral-100" style={{ height: alto }} />
      ))}
    </>
  )
}
