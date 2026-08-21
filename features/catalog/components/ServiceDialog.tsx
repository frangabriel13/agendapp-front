"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cta } from "@/components/CtaLink"
import { control, selectControl } from "@/components/form"
import { cn } from "@/lib/utils"
import type { Service, ServiceCategory } from "@/types"
import { useCategories, useCreateService, useUpdateService } from "../hooks/useCatalog"
import { centsToInput, checkDeposit, inputToCents } from "../lib/money"

/**
 * Paleta del calendario. El color del servicio se ve al lado del turno, así que
 * son tonos que se distinguen entre sí y sobre blanco, no un `<input type=color>`
 * que deja elegir un amarillo ilegible.
 */
const COLORES = [
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#4F46E5",
  "#65A30D",
]

interface Props {
  /** `null` con `open` en true = alta de un servicio nuevo. */
  service: Service | null
  open: boolean
  onClose: () => void
}

export function ServiceDialog({ service, open, onClose }: Props) {
  const editando = service !== null
  const categories = useCategories()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>
            Cuánto dura, cuánto sale y de qué color se ve en la agenda.
          </DialogDescription>
        </DialogHeader>

        <ServiceForm
          // Remonta el formulario al cambiar de servicio: sin esto, abrir otro
          // con el diálogo ya montado deja los valores del anterior.
          key={service?.id ?? "nuevo"}
          service={service}
          categories={categories.data ?? []}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

function ServiceForm({
  service,
  categories,
  onDone,
}: {
  service: Service | null
  categories: ServiceCategory[]
  onDone: () => void
}) {
  const [name, setName] = useState(service?.name ?? "")
  const [description, setDescription] = useState(service?.description ?? "")
  const [categoryId, setCategoryId] = useState(service?.category?.id ?? "")
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 60))
  const [buffer, setBuffer] = useState(String(service?.bufferAfterMinutes ?? 0))
  const [price, setPrice] = useState(centsToInput(service?.priceCents))
  const [deposit, setDeposit] = useState(centsToInput(service?.depositAmountCents))
  const [color, setColor] = useState(service?.color ?? COLORES[0]!)
  const [error, setError] = useState<string | null>(null)

  const crear = useCreateService()
  const actualizar = useUpdateService()
  const guardando = crear.isPending || actualizar.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) return setError("Poné un nombre")

    const minutos = Number(duration)
    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440) {
      return setError("La duración va de 1 a 1440 minutos")
    }

    const priceCents = inputToCents(price)
    if (priceCents === null) return setError("Poné un precio, aunque sea 0")

    // Vacío es "no pide seña", que no es lo mismo que cero.
    const depositCents = deposit.trim() === "" ? null : inputToCents(deposit)
    if (deposit.trim() !== "" && depositCents === null) return setError("La seña no es un número")

    const check = checkDeposit(priceCents, depositCents)
    if (!check.ok) return setError(check.error)

    setError(null)

    const base = {
      name: name.trim(),
      durationMinutes: minutos,
      bufferAfterMinutes: Number(buffer) || 0,
      priceCents,
      color,
    }

    if (service) {
      // En la edición los opcionales viajan como `null` para poder vaciarlos:
      // omitirlos dejaría el valor viejo, y no habría forma de sacar una seña.
      actualizar.mutate(
        {
          id: service.id,
          ...base,
          description: description.trim() || null,
          categoryId: categoryId || null,
          depositAmountCents: depositCents,
        },
        { onSuccess: onDone },
      )
      return
    }

    // En el alta se **omiten**: el backend corre con `forbidNonWhitelisted` y
    // manda solo lo que tiene valor es lo que evita un 400 por campo de más.
    crear.mutate(
      {
        ...base,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(depositCents !== null ? { depositAmountCents: depositCents } : {}),
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="min-h-0 flex-1 space-y-4 overflow-y-auto px-0.5">
      <div>
        <label htmlFor="s-name" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Nombre
        </label>
        <input
          id="s-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoFocus
          placeholder="Corte de dama"
          className={control()}
        />
      </div>

      <div>
        <label htmlFor="s-cat" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Categoría
        </label>
        <select
          id="s-cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectControl()}
        >
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-dur" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Duración
          </label>
          <div className="relative">
            <input
              id="s-dur"
              type="number"
              min={1}
              max={1440}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={cn(control(), "pr-12")}
            />
            <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-neutral-400">
              min
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="s-buf" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Limpieza después
          </label>
          <div className="relative">
            <input
              id="s-buf"
              type="number"
              min={0}
              max={1440}
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
              className={cn(control(), "pr-12")}
            />
            <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-neutral-400">
              min
            </span>
          </div>
        </div>
      </div>

      {/* El buffer es tiempo en que el profesional sigue ocupado: forma parte de
          lo que el turno reserva. Decirlo acá evita la sorpresa de que el último
          turno del día termine antes del cierre. */}
      <p className="-mt-1 text-xs leading-relaxed text-neutral-400">
        La limpieza se suma al turno: el profesional queda ocupado ese rato más.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="s-price" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Precio
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-neutral-400">
              $
            </span>
            <input
              id="s-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              className={cn(control(), "pl-7")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="s-dep" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            Seña
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-neutral-400">
              $
            </span>
            <input
              id="s-dep"
              inputMode="decimal"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="Sin seña"
              className={cn(control(), "pl-7")}
            />
          </div>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-medium text-neutral-700">Color en la agenda</span>
        <div className="flex flex-wrap gap-2">
          {COLORES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-label={`Color ${option}`}
              aria-pressed={color === option}
              style={{ backgroundColor: option }}
              className={cn(
                "size-8 rounded-full transition-transform",
                color === option
                  ? "ring-2 ring-neutral-900 ring-offset-2"
                  : "hover:scale-110",
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="s-desc" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
          Descripción <span className="font-normal text-neutral-400">(opcional)</span>
        </label>
        <textarea
          id="s-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Lavado, corte y peinado."
          className={cn(control(), "resize-none")}
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className={cn(cta({ variant: "outline", size: "sm" }))}
        >
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className={cn(cta({ size: "sm" }))}>
          {guardando ? "Guardando…" : service ? "Guardar" : "Crear servicio"}
        </button>
      </div>
    </form>
  )
}
