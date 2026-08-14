import { apiFetch } from "@/lib/api"
import type {
  Employee,
  EmployeeInvitation,
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
