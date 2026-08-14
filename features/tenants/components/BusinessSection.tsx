"use client"

import { useState } from "react"
import { controlClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import type { Tenant } from "@/types"
import { useUpdateTenant } from "../hooks/useTenant"
import { CURRENCIES, LANGUAGES, TIMEZONES, withCurrent } from "../lib/options"
import { Field, SettingsCard } from "./SettingsCard"

export function BusinessSection({ tenant, canSave }: { tenant: Tenant; canSave: boolean }) {
  const [businessName, setBusinessName] = useState(tenant.businessName)
  const [timezone, setTimezone] = useState(tenant.timezone)
  const [currency, setCurrency] = useState(tenant.currency)
  const [language, setLanguage] = useState(tenant.language)
  const update = useUpdateTenant()

  const problem = businessName.trim() ? null : "El nombre del negocio es requerido"

  return (
    <SettingsCard
      title="Negocio"
      description="Cómo se llama tu negocio y con qué zona horaria y moneda trabaja."
      canSave={canSave}
      saving={update.isPending}
      problem={problem}
      onSave={() => update.mutate({ businessName: businessName.trim(), timezone, currency, language })}
    >
      <Field label="Nombre del negocio" htmlFor="businessName">
        <input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={!canSave}
          className={cn(controlClasses, "border-black/10")}
        />
      </Field>

      <Field
        label="Zona horaria"
        htmlFor="timezone"
        hint="Define a qué hora caen los turnos y los recordatorios."
      >
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          disabled={!canSave}
          className={cn(controlClasses, "border-black/10")}
        >
          {withCurrent(TIMEZONES, tenant.timezone).map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Moneda" htmlFor="currency">
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={!canSave}
            className={cn(controlClasses, "border-black/10")}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Idioma" htmlFor="language">
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={!canSave}
            className={cn(controlClasses, "border-black/10")}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Dirección web" htmlFor="slug" hint="El identificador de tu negocio. No se puede cambiar acá.">
        <input
          id="slug"
          value={tenant.slug}
          readOnly
          disabled
          className={cn(controlClasses, "border-black/10 bg-neutral-50")}
        />
      </Field>
    </SettingsCard>
  )
}
