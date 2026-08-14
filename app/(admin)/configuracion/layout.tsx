import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
export const metadata: Metadata = {
  title: "Configuración",
  description: "Datos del negocio, marca y política de reservas.",
}

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return children
}
