import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
// Este layout existe solo para ponerle título a la ruta.
export const metadata: Metadata = {
  title: "Agenda",
  description: "Calendario semanal de turnos por profesional.",
}

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children
}
