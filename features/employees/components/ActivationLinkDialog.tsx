"use client"

import { useState } from "react"
import { Check, Copy, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import type { EmployeeInvitation } from "@/types"
import { fullName } from "../lib/roles"

interface Props {
  invitation: EmployeeInvitation | null
  onClose: () => void
}

/**
 * Muestra el link de activación recién emitido.
 *
 * El backend lo devuelve **una sola vez**: si se cierra sin copiarlo, la única
 * salida es reenviar la invitación, que emite otro. Por eso el aviso es explícito
 * y el diálogo no se cierra solo.
 */
export function ActivationLinkDialog({ invitation, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!invitation) return
    try {
      await navigator.clipboard.writeText(invitation.activationUrl)
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // `navigator.clipboard` no existe fuera de contexto seguro (http en una IP
      // de la red local, por ejemplo). El link está a la vista para copiarlo a mano.
      toast.error("No pudimos copiar. Seleccioná el link y copialo a mano.")
    }
  }

  return (
    <Dialog
      open={invitation !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {invitation ? `Invitamos a ${fullName(invitation.employee)}` : "Invitación enviada"}
          </DialogTitle>
          <DialogDescription>
            Pasale este link para que active su cuenta y elija una contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[13px] leading-relaxed text-amber-800">
            Este link se muestra <strong className="font-semibold">una sola vez</strong>. Si cerrás sin copiarlo, vas a
            tener que reenviar la invitación para generar uno nuevo.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-neutral-50 p-3">
          <p className="font-mono text-[12px] leading-relaxed break-all text-neutral-700">
            {invitation?.activationUrl}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn(cta({ variant: "outline", size: "sm" }))}>
            Listo
          </button>
          <button type="button" onClick={copy} className={cn(cta({ size: "sm" }))}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
