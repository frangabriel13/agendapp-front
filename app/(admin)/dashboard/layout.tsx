import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
// Este layout existe solo para ponerle título a la ruta.
export const metadata: Metadata = {
  title: "Panel",
  description: "Resumen de turnos, profesionales y actividad de tu estética.",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
