import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import { AuthCard } from "@/features/auth/components/AuthCard"

export const metadata = {
  title: "Recuperar contraseña",
}

export default function OlvideContrasenaPage() {
  return (
    <AuthCard back={{ href: "/login", label: "Volver al login" }}>
      <ForgotPasswordForm />
    </AuthCard>
  )
}
