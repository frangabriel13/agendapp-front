import type { Professional, Appointment } from "@/types"

export const mockProfessionals: Professional[] = [
  { id: "p1", name: "Valentina", email: "vale@demo.com", specialty: "HIFU & Liposonix", branchId: "b1", color: "#7c3aed" },
  { id: "p2", name: "Camila", email: "cami@demo.com", specialty: "Tratamientos faciales", branchId: "b1", color: "#0891b2" },
  { id: "p3", name: "Sofía", email: "sofi@demo.com", specialty: "Corporales", branchId: "b1", color: "#059669" },
]

export const mockAppointments: Appointment[] = [
  {
    id: "a1",
    patientId: "pa1",
    patient: { id: "pa1", name: "Laura Gómez", phone: "11-4455-6677" },
    professionalId: "p1",
    professional: mockProfessionals[0],
    serviceId: "s1",
    service: { id: "s1", name: "HIFU Facial", duration: 60, price: 45000 },
    branchId: "b1",
    date: getTodayStr(),
    startTime: "09:00",
    endTime: "10:00",
    status: "confirmed",
  },
  {
    id: "a2",
    patientId: "pa2",
    patient: { id: "pa2", name: "Marcela Ruiz", phone: "11-2233-4455" },
    professionalId: "p1",
    professional: mockProfessionals[0],
    serviceId: "s2",
    service: { id: "s2", name: "Liposonix Abdomen", duration: 90, price: 65000 },
    branchId: "b1",
    date: getTodayStr(),
    startTime: "11:00",
    endTime: "12:30",
    status: "pending",
  },
  {
    id: "a3",
    patientId: "pa3",
    patient: { id: "pa3", name: "Jimena Torres", phone: "11-6677-8899" },
    professionalId: "p2",
    professional: mockProfessionals[1],
    serviceId: "s3",
    service: { id: "s3", name: "Limpieza profunda", duration: 60, price: 18000 },
    branchId: "b1",
    date: getTodayStr(),
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
  },
  {
    id: "a4",
    patientId: "pa4",
    patient: { id: "pa4", name: "Ana Fernández", phone: "11-9900-1122" },
    professionalId: "p3",
    professional: mockProfessionals[2],
    serviceId: "s4",
    service: { id: "s4", name: "Cavitación", duration: 45, price: 22000 },
    branchId: "b1",
    date: getTodayStr(),
    startTime: "14:00",
    endTime: "14:45",
    status: "completed",
  },
  {
    id: "a5",
    patientId: "pa5",
    patient: { id: "pa5", name: "Patricia Silva", phone: "11-3344-5566" },
    professionalId: "p2",
    professional: mockProfessionals[1],
    serviceId: "s5",
    service: { id: "s5", name: "Hydrafacial", duration: 75, price: 28000 },
    branchId: "b1",
    date: getTodayStr(),
    startTime: "15:00",
    endTime: "16:15",
    status: "confirmed",
  },
]

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]
}
