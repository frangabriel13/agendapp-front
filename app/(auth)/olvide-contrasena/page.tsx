import { KeyRound } from "lucide-react"
import { AuthCard } from "@/features/auth/components/AuthCard"
import { AuthNotice } from "@/features/auth/components/AuthNotice"

export const metadata = {
  title: "Recuperar contraseña",
}

export default function OlvideContrasenaPage() {
  return (
    <AuthCard back={{ href: "/login", label: "Volver al login" }}>
      <AuthNotice
        icon={KeyRound}
        title="Recuperar contraseña"
        description="El restablecimiento por email estará disponible muy pronto. Por ahora, escribinos y te ayudamos a recuperar el acceso."
        primary={{ href: "/#contacto", label: "Contactar soporte" }}
        secondary={{ href: "/login", label: "Volver a intentar" }}
      />
    </AuthCard>
  )
}
