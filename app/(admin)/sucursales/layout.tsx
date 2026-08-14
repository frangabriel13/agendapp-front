import type { Metadata } from "next"

// La página es un Client Component y esos no pueden exportar `metadata`.
export const metadata: Metadata = {
  title: "Sucursales",
  description: "Locales, horarios de atención y feriados.",
}

export default function SucursalesLayout({ children }: { children: React.ReactNode }) {
  return children
}
