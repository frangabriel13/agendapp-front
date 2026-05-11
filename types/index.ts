export type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "RECEPTIONIST" | "PROFESSIONAL"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  businessId?: string
}

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  businessId: string
}

export interface Professional {
  id: string
  name: string
  email: string
  specialty: string
  branchId: string
  color: string
}

export interface Equipment {
  id: string
  name: string
  quantity: number
  branchId: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  equipmentId?: string
  equipment?: Equipment
}

export interface Patient {
  id: string
  name: string
  phone: string
  email?: string
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export interface Appointment {
  id: string
  patientId: string
  patient: Patient
  professionalId: string
  professional: Professional
  serviceId: string
  service: Service
  branchId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
}
