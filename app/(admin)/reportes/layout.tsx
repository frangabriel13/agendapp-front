import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
// Este layout existe solo para ponerle título a la ruta.
export const metadata: Metadata = {
  title: "Reportes",
  description: "Facturación del mes, por servicio y por profesional.",
}

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  return children
}
