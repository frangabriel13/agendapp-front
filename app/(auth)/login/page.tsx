import { AuthCard } from "@/features/auth/components/AuthCard"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata = {
  title: "Ingresar",
}

export default function LoginPage() {
  return (
    <AuthCard back={{ href: "/", label: "Volver al inicio" }}>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Ingresá a tu panel</h1>
        <p className="mt-1.5 text-[13px] text-neutral-500">Con el email y la contraseña de tu cuenta.</p>
      </div>
      <LoginForm />
    </AuthCard>
  )
}
