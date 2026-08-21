"use client"

import { useState } from "react"
import {
  Boxes,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Scissors,
  Tag,
  Trash2,
  Users,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { CategoryDialog } from "@/features/catalog/components/CategoryDialog"
import { ResourceDialog } from "@/features/catalog/components/ResourceDialog"
import { ServiceDialog } from "@/features/catalog/components/ServiceDialog"
import { ServiceStaffDialog } from "@/features/catalog/components/ServiceStaffDialog"
import {
  useCategories,
  useRemoveCategory,
  useRemoveResource,
  useRemoveService,
  useResources,
  useServices,
  useToggleService,
} from "@/features/catalog/hooks/useCatalog"
import { formatCents, formatDuration } from "@/features/catalog/lib/money"
import type { Resource, Service, ServiceCategory } from "@/types"
import { Page, PageHeader } from "../ui/Page"

type Solapa = "servicios" | "categorias" | "recursos"

const SOLAPAS: { key: Solapa; label: string; icon: typeof Scissors }[] = [
  { key: "servicios", label: "Servicios", icon: Scissors },
  { key: "categorias", label: "Categorías", icon: Tag },
  { key: "recursos", label: "Recursos", icon: Boxes },
]

/**
 * El catálogo: qué vendés, agrupado en qué, y con qué lo prestás.
 *
 * **Tres solapas y no tres pantallas** porque son tres entidades que solo tienen
 * sentido juntas: un servicio sin categoría se entiende, pero una categoría sola
 * no es nada. Y **no son un diálogo dentro de servicios** —como los horarios
 * dentro de una sucursal— porque cada una es un ABM completo, no la
 * configuración de otra cosa.
 */
export default function ServiciosPage() {
  const { data: session } = useSession()
  const manage = canManage(session?.employee.role)
  const [solapa, setSolapa] = useState<Solapa>("servicios")

  return (
    <Page width="wide">
      <PageHeader
        title="Catálogo"
        description="Qué vendés, cuánto dura y quién lo hace."
      />

      <div
        role="tablist"
        aria-label="Secciones del catálogo"
        className="mb-5 inline-flex gap-1 rounded-full border border-black/[0.07] bg-white p-1"
      >
        {SOLAPAS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={solapa === key}
            onClick={() => setSolapa(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              solapa === key
                ? "bg-violet-600 text-white"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {solapa === "servicios" && <ServiciosTab manage={manage} />}
      {solapa === "categorias" && <CategoriasTab manage={manage} />}
      {solapa === "recursos" && <RecursosTab manage={manage} />}
    </Page>
  )
}

// --- Estados compartidos ---------------------------------------------------

function Cargando({ filas = 3 }: { filas?: number }) {
  return (
    <ul className="divide-y divide-black/[0.06]">
      {Array.from({ length: filas }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="size-9 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Fallo({ error, onRetry, texto }: { error: unknown; onRetry: () => void; texto: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-neutral-900">{texto}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
        {apiErrorMessage(error, "Revisá tu conexión y probá de nuevo.")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
      >
        <RotateCw size={15} />
        Reintentar
      </button>
    </div>
  )
}

function Vacio({
  icon: Icon,
  titulo,
  bajada,
}: {
  icon: typeof Scissors
  titulo: string
  bajada: string
}) {
  return (
    <div className="px-5 py-12 text-center">
      <Icon size={28} aria-hidden className="mx-auto mb-3 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-900">{titulo}</p>
      <p className="mt-1 text-[13px] text-neutral-500">{bajada}</p>
    </div>
  )
}

function Caja({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">{children}</div>
  )
}

function BarraAccion({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex justify-end">{children}</div>
}

// --- Servicios -------------------------------------------------------------

function ServiciosTab({ manage }: { manage: boolean }) {
  const services = useServices()
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [staff, setStaff] = useState<Service | null>(null)
  const [removing, setRemoving] = useState<Service | null>(null)

  const remove = useRemoveService()
  const toggle = useToggleService()

  return (
    <>
      {manage && (
        <BarraAccion>
          <button type="button" onClick={() => setCreating(true)} className={cn(cta({ size: "sm" }))}>
            <Plus size={15} />
            Nuevo servicio
          </button>
        </BarraAccion>
      )}

      <Caja>
        {services.isPending && <Cargando />}
        {services.isError && (
          <Fallo
            error={services.error}
            onRetry={() => services.refetch()}
            texto="No pudimos cargar los servicios"
          />
        )}
        {services.data?.length === 0 && (
          <Vacio
            icon={Scissors}
            titulo="Todavía no hay servicios"
            bajada={
              manage
                ? "Sin catálogo no hay turno que reservar: creá el primero."
                : "Pedile a un administrador que cargue el catálogo."
            }
          />
        )}

        {services.data && services.data.length > 0 && (
          <ul className="divide-y divide-black/[0.06]">
            {services.data.map((service) => (
              <li key={service.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  aria-hidden
                  style={{ backgroundColor: service.color ?? "#a3a3a3" }}
                  className="size-9 shrink-0 rounded-xl"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        service.isActive ? "text-neutral-900" : "text-neutral-400",
                      )}
                    >
                      {service.name}
                    </p>
                    {service.category && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                        {service.category.name}
                      </span>
                    )}
                    {!service.isActive && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                    {formatDuration(service.durationMinutes)}
                    {service.bufferAfterMinutes > 0 && ` + ${service.bufferAfterMinutes} de limpieza`}
                    {" · "}
                    {formatCents(service.priceCents)}
                    {service.depositAmountCents !== null &&
                      ` · seña ${formatCents(service.depositAmountCents)}`}
                  </p>
                </div>

                {manage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setStaff(service)}
                      className={cn(cta({ variant: "outline", size: "sm" }))}
                    >
                      <Users size={14} />
                      Quién lo presta
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Acciones de ${service.name}`}
                        className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(service)}>
                          <Pencil size={14} />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            toggle.mutate({ id: service.id, isActive: !service.isActive })
                          }
                        >
                          {service.isActive ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(service)}>
                          <Trash2 size={14} />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Caja>

      {manage && (
        <>
          <ServiceDialog
            service={editing}
            open={creating || editing !== null}
            onClose={() => {
              setCreating(false)
              setEditing(null)
            }}
          />
          <ServiceStaffDialog service={staff} onClose={() => setStaff(null)} />
          <ConfirmarBaja
            abierto={removing !== null}
            titulo={`¿Eliminar ${removing?.name}?`}
            descripcion="Los turnos que ya lo usaron guardan su propia copia del precio y la duración, así que no se tocan."
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              if (removing) remove.mutate(removing.id)
              setRemoving(null)
            }}
          />
        </>
      )}
    </>
  )
}

// --- Categorías ------------------------------------------------------------

function CategoriasTab({ manage }: { manage: boolean }) {
  const categories = useCategories()
  const services = useServices()
  const [editing, setEditing] = useState<ServiceCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<ServiceCategory | null>(null)

  const remove = useRemoveCategory()

  const cuantos = (id: string) =>
    (services.data ?? []).filter((service) => service.category?.id === id).length

  return (
    <>
      {manage && (
        <BarraAccion>
          <button type="button" onClick={() => setCreating(true)} className={cn(cta({ size: "sm" }))}>
            <Plus size={15} />
            Nueva categoría
          </button>
        </BarraAccion>
      )}

      <Caja>
        {categories.isPending && <Cargando filas={2} />}
        {categories.isError && (
          <Fallo
            error={categories.error}
            onRetry={() => categories.refetch()}
            texto="No pudimos cargar las categorías"
          />
        )}
        {categories.data?.length === 0 && (
          <Vacio
            icon={Tag}
            titulo="Todavía no hay categorías"
            bajada="Son opcionales: sirven para agrupar el catálogo cuando crece."
          />
        )}

        {categories.data && categories.data.length > 0 && (
          <ul className="divide-y divide-black/[0.06]">
            {categories.data.map((category) => (
              <li key={category.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-medium text-neutral-500"
                >
                  {category.displayOrder}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{category.name}</p>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    {cuantos(category.id)} {cuantos(category.id) === 1 ? "servicio" : "servicios"}
                  </p>
                </div>

                {manage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Acciones de ${category.name}`}
                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(category)}>
                        <Pencil size={14} />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(category)}>
                        <Trash2 size={14} />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </Caja>

      {manage && (
        <>
          <CategoryDialog
            category={editing}
            open={creating || editing !== null}
            onClose={() => {
              setCreating(false)
              setEditing(null)
            }}
          />
          <ConfirmarBaja
            abierto={removing !== null}
            titulo={`¿Eliminar ${removing?.name}?`}
            // Es la parte que sorprende: borrar la categoría no borra lo que
            // agrupaba. Decirlo evita que alguien no la borre por las dudas.
            descripcion={
              removing && cuantos(removing.id) > 0
                ? `Sus ${cuantos(removing.id)} servicios no se borran: quedan sin categoría.`
                : "No tiene servicios asociados."
            }
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              if (removing) remove.mutate(removing.id)
              setRemoving(null)
            }}
          />
        </>
      )}
    </>
  )
}

// --- Recursos --------------------------------------------------------------

function RecursosTab({ manage }: { manage: boolean }) {
  const resources = useResources()
  const [editing, setEditing] = useState<Resource | null>(null)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<Resource | null>(null)

  const remove = useRemoveResource()

  return (
    <>
      {manage && (
        <BarraAccion>
          <button type="button" onClick={() => setCreating(true)} className={cn(cta({ size: "sm" }))}>
            <Plus size={15} />
            Nuevo recurso
          </button>
        </BarraAccion>
      )}

      <Caja>
        {resources.isPending && <Cargando filas={2} />}
        {resources.isError && (
          <Fallo
            error={resources.error}
            onRetry={() => resources.refetch()}
            texto="No pudimos cargar los recursos"
          />
        )}
        {resources.data?.length === 0 && (
          <Vacio
            icon={Boxes}
            titulo="Todavía no hay recursos"
            bajada="Una camilla o una sala que un turno ocupa además del profesional."
          />
        )}

        {resources.data && resources.data.length > 0 && (
          <ul className="divide-y divide-black/[0.06]">
            {resources.data.map((resource) => (
              <li key={resource.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100"
                >
                  <Boxes size={16} className="text-neutral-400" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{resource.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                    {resource.branch?.name}
                    {resource.description && ` · ${resource.description}`}
                  </p>
                </div>

                {manage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Acciones de ${resource.name}`}
                      className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(resource)}>
                        <Pencil size={14} />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(resource)}>
                        <Trash2 size={14} />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </Caja>

      {manage && (
        <>
          <ResourceDialog
            resource={editing}
            open={creating || editing !== null}
            onClose={() => {
              setCreating(false)
              setEditing(null)
            }}
          />
          <ConfirmarBaja
            abierto={removing !== null}
            titulo={`¿Eliminar ${removing?.name}?`}
            descripcion="Los servicios que lo pedían dejan de pedirlo."
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              if (removing) remove.mutate(removing.id)
              setRemoving(null)
            }}
          />
        </>
      )}
    </>
  )
}

function ConfirmarBaja({
  abierto,
  titulo,
  descripcion,
  onCancel,
  onConfirm,
}: {
  abierto: boolean
  titulo: string
  descripcion: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
