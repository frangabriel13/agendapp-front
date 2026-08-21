"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { control } from "@/components/form"
import { cn } from "@/lib/utils"
import type { Customer, CustomerTag } from "@/types"
import { useCreateTag, useRemoveTag, useSetCustomerTags, useTags } from "../hooks/useCustomers"
import { fullName } from "../lib/customer"

const COLORES = ["#7C3AED", "#DB2777", "#0891B2", "#059669", "#D97706", "#DC2626"]

interface Props {
  customer: Customer | null
  onClose: () => void
  /** Administrar la lista de etiquetas es OWNER / ADMINISTRATIVE. */
  canManageTags: boolean
}

/**
 * Las etiquetas de un cliente, y de paso el ABM de la lista.
 *
 * Van juntas porque el momento en que hace falta una etiqueta nueva es
 * justamente cuando se está etiquetando a alguien: mandar al usuario a otra
 * pantalla a crearla y volver es el camino largo para escribir dos palabras.
 */
export function TagsDialog({ customer, onClose, canManageTags }: Props) {
  const open = customer !== null
  const tags = useTags()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Etiquetas</DialogTitle>
          <DialogDescription>{customer && fullName(customer)}</DialogDescription>
        </DialogHeader>

        {customer && (
          <TagsForm
            key={customer.id}
            customer={customer}
            tags={tags.data ?? []}
            cargando={tags.isPending}
            canManageTags={canManageTags}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TagsForm({
  customer,
  tags,
  cargando,
  canManageTags,
  onDone,
}: {
  customer: Customer
  tags: CustomerTag[]
  cargando: boolean
  canManageTags: boolean
  onDone: () => void
}) {
  const puestas = new Set(customer.tags.map((tag) => tag.id))
  const [selected, setSelected] = useState(puestas)
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState("")
  const [color, setColor] = useState(COLORES[0]!)

  const guardar = useSetCustomerTags()
  const crear = useCreateTag()
  const borrar = useRemoveTag()

  const cambio =
    selected.size !== puestas.size || [...selected].some((id) => !puestas.has(id))

  const alternar = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const crearEtiqueta = () => {
    if (!nombre.trim()) return
    crear.mutate(
      { name: nombre.trim(), color },
      {
        onSuccess: (tag) => {
          // Se marca sola: se creó estando en la ficha de alguien, así que es
          // para ponérsela.
          setSelected((prev) => new Set(prev).add(tag.id))
          setNombre("")
          setCreando(false)
        },
      },
    )
  }

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5">
      {cargando && <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />}

      {!cargando && tags.length === 0 && !creando && (
        <p className="py-6 text-center text-[13px] text-neutral-500">
          Todavía no hay etiquetas. Sirven para marcar algo que se repite: VIP, debe seña.
        </p>
      )}

      {!cargando && tags.length > 0 && (
        <ul className="space-y-1.5">
          {tags.map((tag) => {
            const activa = selected.has(tag.id)
            return (
              <li key={tag.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alternar(tag.id)}
                  aria-pressed={activa}
                  className={cn(
                    "flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                    activa ? "border-neutral-900 bg-neutral-50" : "border-black/10 hover:border-neutral-300",
                  )}
                >
                  <span
                    aria-hidden
                    style={{ backgroundColor: tag.color ?? "#a3a3a3" }}
                    className="size-2.5 shrink-0 rounded-full"
                  />
                  <span className="flex-1 truncate text-[13px] text-neutral-900">{tag.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {tag.customerCount} {tag.customerCount === 1 ? "cliente" : "clientes"}
                  </span>
                  {activa && <Check size={14} strokeWidth={3} className="text-neutral-900" aria-hidden />}
                </button>

                {canManageTags && (
                  <button
                    type="button"
                    onClick={() => borrar.mutate(tag.id)}
                    aria-label={`Eliminar la etiqueta ${tag.name}`}
                    // Dar de baja una etiqueta la saca de **todos** los clientes,
                    // no solo de este. El título lo dice antes de hacerlo.
                    title={
                      tag.customerCount === 0
                        ? "No la tiene ningún cliente"
                        : tag.customerCount === 1
                          ? "Se la saca al cliente que la tiene"
                          : `Se la saca a los ${tag.customerCount} clientes que la tienen`
                    }
                    className="rounded-lg p-2 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canManageTags &&
        (creando ? (
          <div className="space-y-2.5 rounded-xl border border-black/10 p-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crearEtiqueta()}
              maxLength={60}
              autoFocus
              placeholder="Nombre de la etiqueta"
              aria-label="Nombre de la etiqueta"
              className={control()}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {COLORES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    aria-label={`Color ${option}`}
                    aria-pressed={color === option}
                    style={{ backgroundColor: option }}
                    className={cn(
                      "size-6 rounded-full",
                      color === option && "ring-2 ring-neutral-900 ring-offset-2",
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCreando(false)}
                  className={cn(cta({ variant: "outline", size: "sm" }))}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearEtiqueta}
                  disabled={crear.isPending || !nombre.trim()}
                  className={cn(cta({ size: "sm" }))}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 py-2.5 text-[13px] text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900"
          >
            <Plus size={14} />
            Nueva etiqueta
          </button>
        ))}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className={cn(cta({ variant: "outline", size: "sm" }))}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={() =>
            guardar.mutate({ id: customer.id, tagIds: [...selected] }, { onSuccess: onDone })
          }
          disabled={guardar.isPending || !cambio}
          className={cn(cta({ size: "sm" }))}
        >
          {guardar.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  )
}
