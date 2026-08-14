import { Clock } from "lucide-react"
import { AuthCard } from "@/features/auth/components/AuthCard"
import { AuthNotice } from "@/features/auth/components/AuthNotice"

export const metadata = {
  title: "Crear cuenta",
}

export default function RegistroPage() {
  return (
    <AuthCard back={{ href: "/", label: "Volver al inicio" }}>
      <AuthNotice
        icon={Clock}
        title="Registro próximamente"
        description="Estamos terminando el alta de cuentas. Mientras tanto, escribinos y te damos acceso para probar reservApp."
        primary={{ href: "/#contacto", label: "Quiero que me avisen" }}
        secondary={{ href: "/login", label: "Ya tengo cuenta" }}
      />
    </AuthCard>
  )
}
