import { apiFetch } from "@/lib/api"
import type {
  ActivateAccountPayload,
  Employee,
  EmployeeDetail,
  EmployeeInvitation,
  EmployeeShift,
  EmployeeShiftInput,
  CreateTimeOffPayload,
  TimeOff,
  UpdateEmployeePayload,
  InviteEmployeePayload,
} from "@/types"

export function listEmployeesRequest(): Promise<Employee[]> {
  return apiFetch<Employee[]>("/employees")
}

/**
 * Da de alta al empleado sin contraseña y devuelve el link de activación.
 *
 * Ese link viene **una sola vez**: hay que mostrarlo apenas llega o se pierde.
 * Para recuperarlo hay que reenviar la invitación, que emite uno nuevo.
 */
export function inviteEmployeeRequest(payload: InviteEmployeePayload): Promise<EmployeeInvitation> {
  return apiFetch<EmployeeInvitation>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * El backend corre con `forbidNonWhitelisted`: un campo de más devuelve 400.
 * Por eso se manda solo lo que cambió, nunca el empleado entero.
 */
export function updateEmployeeRequest(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  return apiFetch<Employee>(`/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function removeEmployeeRequest(id: string): Promise<void> {
  return apiFetch<void>(`/employees/${id}`, { method: "DELETE" })
}

/** Emite un link de activación nuevo e invalida el anterior. */
export function resendInvitationRequest(id: string): Promise<EmployeeInvitation> {
  return apiFetch<EmployeeInvitation>(`/employees/${id}/invitation`, { method: "POST" })
}

export function listTimeOffRequest(id: string): Promise<TimeOff[]> {
  return apiFetch<TimeOff[]>(`/employees/${id}/time-off`)
}

export function createTimeOffRequest(id: string, payload: CreateTimeOffPayload): Promise<TimeOff> {
  return apiFetch<TimeOff>(`/employees/${id}/time-off`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function removeTimeOffRequest(id: string, timeOffId: string): Promise<void> {
  return apiFetch<void>(`/employees/${id}/time-off/${timeOffId}`, { method: "DELETE" })
}

/** El detalle agrega `branchIds`, que el listado no trae. */
export function getEmployeeRequest(id: string): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(`/employees/${id}`)
}

export function listSchedulesRequest(id: string): Promise<EmployeeShift[]> {
  return apiFetch<EmployeeShift[]>(`/employees/${id}/schedules`)
}

/**
 * Reemplaza las sucursales del empleado por la lista que se manda: lo que no
 * está, se desasigna. Devuelve los ids que quedaron.
 */
export function setBranchesRequest(id: string, branchIds: string[]): Promise<string[]> {
  return apiFetch<string[]>(`/employees/${id}/branches`, {
    method: "PUT",
    body: JSON.stringify({ branchIds }),
  })
}

/**
 * Reemplaza la semana completa de tramos. No hay alta ni baja individual: se
 * manda cómo queda la semana entera, y mandar `[]` la vacía.
 */
export function setSchedulesRequest(id: string, shifts: EmployeeShiftInput[]): Promise<EmployeeShift[]> {
  return apiFetch<EmployeeShift[]>(`/employees/${id}/schedules`, {
    method: "PUT",
    body: JSON.stringify({ shifts }),
  })
}

/**
 * Cierra la invitación: valida el token del link y fija la contraseña.
 *
 * Va sin `Authorization` a propósito — es el único endpoint de `/employees` que
 * es público, porque quien lo usa todavía no tiene cuenta con la que loguearse.
 */
export function activateAccountRequest(payload: ActivateAccountPayload): Promise<void> {
  return apiFetch<void>(
    "/employees/activate",
    { method: "POST", body: JSON.stringify(payload) },
    { auth: false },
  )
}
