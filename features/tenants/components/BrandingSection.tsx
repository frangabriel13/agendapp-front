"use client"

import { useState } from "react"
import Image from "next/image"
import { controlClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import type { TenantBranding } from "@/types"
import { useUpdateBranding } from "../hooks/useTenant"
import { Field, SettingsCard } from "./SettingsCard"

const HEX = /^#[0-9a-fA-F]{6}$/

export function BrandingSection({ branding, canSave }: { branding: TenantBranding; canSave: boolean }) {
  const [displayName, setDisplayName] = useState(branding.displayName)
  const [description, setDescription] = useState(branding.description ?? "")
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor ?? "#7C3AED")
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl ?? "")
  const update = useUpdateBranding()

  const problem = !displayName.trim()
    ? "El nombre visible es requerido"
    : !HEX.test(primaryColor)
      ? "El color tiene que ser un hexadecimal como #7C3AED"
      : null

  return (
    <SettingsCard
      title="Marca"
      description="Cómo se ve tu negocio para quien reserva."
      canSave={canSave}
      saving={update.isPending}
      problem={problem}
      onSave={() =>
        update.mutate({
          displayName: displayName.trim(),
          primaryColor,
          // Vacío se manda como `null` para borrar el dato, no como "".
          description: description.trim() || null,
          logoUrl: logoUrl.trim() || null,
        })
      }
    >
      <Field label="Nombre visible" htmlFor="displayName" hint="Puede diferir de la razón social.">
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={!canSave}
          className={cn(controlClasses, "border-black/10")}
        />
      </Field>

      <Field label="Descripción" htmlFor="description">
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canSave}
          placeholder="Qué hace tu negocio, en una o dos líneas."
          className={cn(controlClasses, "resize-none border-black/10")}
        />
      </Field>

      <Field label="Color principal" htmlFor="primaryColor">
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            type="color"
            value={HEX.test(primaryColor) ? primaryColor : "#7C3AED"}
            onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
            disabled={!canSave}
            className="size-10 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-white p-1 disabled:cursor-not-allowed"
          />
          {/* El campo de texto acompaña al selector: pegar un hex de la identidad
              de marca es más rápido que buscarlo en la rueda de color. */}
          <input
            aria-label="Color principal en hexadecimal"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
            disabled={!canSave}
            className={cn(controlClasses, "border-black/10 font-mono")}
          />
        </div>
      </Field>

      <Field
        label="Logo"
        htmlFor="logoUrl"
        hint="Dirección de una imagen ya publicada. Todavía no se pueden subir archivos."
      >
        <input
          id="logoUrl"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={!canSave}
          placeholder="https://…"
          className={cn(controlClasses, "border-black/10")}
        />
        {/* `unoptimized` porque es un dominio arbitrario que el usuario pega, y
            el optimizador de Next solo procesa hosts declarados en la config. */}
        {logoUrl.trim() && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/[0.07] bg-neutral-50 p-3">
            <Image
              src={logoUrl}
              alt=""
              width={120}
              height={40}
              unoptimized
              className="h-8 w-auto object-contain"
            />
            <p className="text-xs text-neutral-400">Vista previa</p>
          </div>
        )}
      </Field>
    </SettingsCard>
  )
}
