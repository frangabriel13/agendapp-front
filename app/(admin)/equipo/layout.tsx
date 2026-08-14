import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
// Este layout existe solo para ponerle título a la ruta.
export const metadata: Metadata = {
  title: "Equipo",
  description: "Gestión de profesionales y accesos de tu estética.",
}

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  return children
}
