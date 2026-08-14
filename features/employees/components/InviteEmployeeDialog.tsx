"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import { useInviteEmployee } from "../hooks/useEmployees"
import { ROLE_LABELS } from "../lib/roles"
import type { EmployeeInvitation } from "@/types"

const schema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido"),
  lastName: z.string().trim().min(1, "El apellido es requerido"),
  email: z.string().trim().min(1, "El email es requerido").email("El email no es válido"),
  phone: z.string().trim(),
  role: z.enum(["PROFESSIONAL", "ADMINISTRATIVE"]),
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited: (invitation: EmployeeInvitation) => void
}

export function InviteEmployeeDialog({ open, onOpenChange, onInvited }: Props) {
  const invite = useInviteEmployee()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", role: "PROFESSIONAL" },
  })

  function onSubmit(values: Values) {
    // El backend corre con `forbidNonWhitelisted` y valida formato: mandar
    // `phone: ""` es un campo vacío que no representa nada. Se omite.
    invite.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        ...(values.phone ? { phone: values.phone } : {}),
      },
      {
        onSuccess: (invitation) => {
          reset()
          onOpenChange(false)
          onInvited(invitation)
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar a alguien del equipo</DialogTitle>
          <DialogDescription>
            Le creamos la cuenta y te damos un link de activación para pasarle.
          </DialogDescription>
        </DialogHeader>

        {/* `handleSubmit` traga el rechazo de `mutateAsync`, y el error ya se
            muestra en un toast desde el hook. */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label="Nombre" error={errors.firstName?.message}>
              <input id="firstName" autoComplete="off" className={control(errors.firstName)} {...register("firstName")} />
            </Field>
            <Field id="lastName" label="Apellido" error={errors.lastName?.message}>
              <input id="lastName" autoComplete="off" className={control(errors.lastName)} {...register("lastName")} />
            </Field>
          </div>

          <Field id="email" label="Email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              placeholder="hola@ejemplo.com"
              autoComplete="off"
              className={control(errors.email)}
              {...register("email")}
            />
          </Field>

          <Field id="phone" label="Teléfono (opcional)" error={errors.phone?.message}>
            <input id="phone" type="tel" placeholder="11-4455-6677" className={control(errors.phone)} {...register("phone")} />
          </Field>

          <Field id="role" label="Rol" error={errors.role?.message}>
            <select id="role" className={control(errors.role)} {...register("role")}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={cn(cta({ variant: "outline", size: "sm" }))}
            >
              Cancelar
            </button>
            <button type="submit" disabled={invite.isPending} className={cn(cta({ size: "sm" }))}>
              {invite.isPending ? "Invitando…" : "Enviar invitación"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
