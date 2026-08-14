import type { AssignableRole, EmployeeRole, EmployeeStatus } from "@/types"

/** Roles que se pueden asignar. `OWNER` no está: el backend no deja moverlo. */
export const ROLE_LABELS: Record<AssignableRole, string> = {
  PROFESSIONAL: "Profesional",
  ADMINISTRATIVE: "Administrativo",
}

export const ALL_ROLE_LABELS: Record<EmployeeRole, string> = {
  OWNER: "Dueño",
  ...ROLE_LABELS,
}

export const ROLE_HINTS: Record<EmployeeRole, string> = {
  OWNER: "Acceso total. Es de quien creó el negocio y no se puede cambiar.",
  ADMINISTRATIVE: "Puede gestionar equipo, sucursales y configuración.",
  PROFESSIONAL: "Ve la agenda y atiende turnos. No puede cambiar configuración.",
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
}

export const STATUS_BADGE: Record<EmployeeStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
}

export function fullName(employee: { user: { firstName: string; lastName: string } }): string {
  return `${employee.user.firstName} ${employee.user.lastName}`.trim()
}

export function initials(employee: { user: { firstName: string; lastName: string } }): string {
  const { firstName, lastName } = employee.user
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
