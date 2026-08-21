"use client"

import { useMemo, useState } from "react"
import {
  Cake,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RotateCw,
  Search,
  Tag,
  Trash2,
  UsersRound,
  X,
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
import { controlClasses } from "@/components/form"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { PAGE_SIZE, pageAfterRemoval } from "@/lib/pagination"
import { canManage, useSession } from "@/features/auth/hooks/useAuth"
import { CustomerDialog } from "@/features/customers/components/CustomerDialog"
import { Pagination } from "@/features/customers/components/Pagination"
import { TagsDialog } from "@/features/customers/components/TagsDialog"
import { useCustomers, useRemoveCustomer, useTags } from "@/features/customers/hooks/useCustomers"
import { useDebounced } from "@/features/customers/hooks/useDebounced"
import { age, birthdayToday, fullName, initials } from "@/features/customers/lib/customer"
import type { Customer } from "@/types"
import { Page, PageHeader } from "../ui/Page"

export default function ClientesPage() {
  const { data: session } = useSession()
  // Cargar y editar lo puede hacer cualquier empleado —quien atiende el mostrador
  // no siempre es administrativo—; dar de baja y administrar etiquetas, no.
  const manage = canManage(session?.employee.role)

  const [texto, setTexto] = useState("")
  const [tagId, setTagId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const search = useDebounced(texto)

  const [editing, setEditing] = useState<Customer | null>(null)
  const [creating, setCreating] = useState(false)
  const [tagging, setTagging] = useState<Customer | null>(null)
  const [removing, setRemoving] = useState<Customer | null>(null)

  const customers = useCustomers({
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(tagId ? { tagId } : {}),
  })
  const tags = useTags()
  const remove = useRemoveCustomer()

  // `now` una sola vez: si se recalculara en cada render, cruzar la medianoche
  // cambiaría las edades a mitad de una interacción.
  const now = useMemo(() => new Date(), [])

  const meta = customers.data?.meta
  const lista = customers.data?.data ?? []
  const filtrando = search !== "" || tagId !== null

  /** Volver a la 1 al cambiar el filtro: la página 5 de otra búsqueda no existe. */
  const filtrar = (accion: () => void) => {
    accion()
    setPage(1)
  }

  return (
    <Page width="wide">
      <PageHeader
        title="Clientes"
        description="Quién viene, cómo ubicarlo y qué conviene recordar."
        action={
          <button type="button" onClick={() => setCreating(true)} className={cn(cta({ size: "sm" }))}>
            <Plus size={15} />
            Nuevo cliente
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            aria-hidden
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={texto}
            onChange={(e) => filtrar(() => setTexto(e.target.value))}
            // Una sola caja: el backend cruza nombre, apellido, email y teléfono.
            placeholder="Buscar por nombre, teléfono o email"
            aria-label="Buscar clientes"
            className={cn(controlClasses, "border-black/10 pl-9")}
          />
          {texto && (
            <button
              type="button"
              onClick={() => filtrar(() => setTexto(""))}
              aria-label="Limpiar la búsqueda"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-neutral-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {(tags.data ?? []).map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => filtrar(() => setTagId(tagId === tag.id ? null : tag.id))}
            aria-pressed={tagId === tag.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
              tagId === tag.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-black/10 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            <span
              aria-hidden
              style={{ backgroundColor: tag.color ?? "#a3a3a3" }}
              className="size-2 rounded-full"
            />
            {tag.name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        {customers.isPending && (
          <ul className="divide-y divide-black/[0.06]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="size-9 shrink-0 animate-pulse rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {customers.isError && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No pudimos cargar los clientes</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
              {apiErrorMessage(customers.error, "Revisá tu conexión y probá de nuevo.")}
            </p>
            <button
              type="button"
              onClick={() => customers.refetch()}
              className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
            >
              <RotateCw size={15} />
              Reintentar
            </button>
          </div>
        )}

        {customers.data && lista.length === 0 && (
          <div className="px-5 py-12 text-center">
            <UsersRound size={28} aria-hidden className="mx-auto mb-3 text-neutral-300" />
            {/* Una búsqueda sin resultados no es lo mismo que no tener clientes:
                el primer caso pide corregir el filtro, el segundo cargar el primero. */}
            <p className="text-sm font-medium text-neutral-900">
              {filtrando ? "Nadie coincide con esa búsqueda" : "Todavía no hay clientes"}
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {filtrando
                ? "Probá con menos palabras, o con el teléfono."
                : "El teléfono es lo que identifica a cada persona."}
            </p>
            {filtrando && (
              <button
                type="button"
                onClick={() =>
                  filtrar(() => {
                    setTexto("")
                    setTagId(null)
                  })
                }
                className={cn(cta({ variant: "outline", size: "sm" }), "mt-5")}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {lista.length > 0 && (
          <ul
            className={cn(
              "divide-y divide-black/[0.06] transition-opacity",
              // Mientras llega la página siguiente se ve la anterior, apenas
              // apagada: vaciar la tabla haría saltar el scroll en cada tecla.
              customers.isPlaceholderData && "opacity-50",
            )}
          >
            {lista.map((customer) => {
              const años = age(customer.dateOfBirth, now)
              const cumple = birthdayToday(customer.dateOfBirth, now)

              return (
                <li key={customer.id} className="flex items-center gap-4 px-5 py-4">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600"
                  >
                    {initials(customer)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {fullName(customer)}
                      </p>
                      {cumple && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          <Cake size={10} aria-hidden />
                          Cumple hoy
                        </span>
                      )}
                      {customer.tags.map((tag) => (
                        <span
                          key={tag.id}
                          style={{
                            backgroundColor: `color-mix(in oklab, ${tag.color ?? "#a3a3a3"} 12%, #fff)`,
                            color: `color-mix(in oklab, ${tag.color ?? "#a3a3a3"} 78%, #000)`,
                          }}
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Phone size={11} aria-hidden className="text-neutral-400" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail size={11} aria-hidden className="text-neutral-400" />
                          {customer.email}
                        </span>
                      )}
                      {años !== null && <span>{años} años</span>}
                    </p>

                    {customer.notes && (
                      <p className="mt-1 truncate text-xs text-neutral-400">{customer.notes}</p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Acciones de ${fullName(customer)}`}
                      className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(customer)}>
                        <Pencil size={14} />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setTagging(customer)}>
                        <Tag size={14} />
                        Etiquetas
                      </DropdownMenuItem>
                      {manage && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setRemoving(customer)}
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              )
            })}
          </ul>
        )}

        {meta && meta.total > 0 && <Pagination meta={meta} onChange={setPage} />}
      </div>

      <CustomerDialog
        customer={editing}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onOpenExisting={(id) => {
          // La ficha duplicada puede estar en cualquier página: se busca por
          // teléfono, que es justamente lo que la hizo chocar.
          const ya = lista.find((c) => c.id === id)
          setCreating(false)
          setEditing(ya ?? null)
          if (!ya) filtrar(() => setTexto(""))
        }}
      />

      <TagsDialog customer={tagging} onClose={() => setTagging(null)} canManageTags={manage} />

      <AlertDialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removing && `¿Eliminar a ${fullName(removing)}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              Su teléfono queda libre para cargar una ficha nueva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) remove.mutate(removing.id)
                // Borrar el último de la página la dejaba vacía con una
                // paginación que decía que había páginas.
                if (meta) setPage(pageAfterRemoval(meta))
                setRemoving(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
