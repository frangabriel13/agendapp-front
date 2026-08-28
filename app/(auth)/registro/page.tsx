import { AuthCard } from "@/features/auth/components/AuthCard"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

export const metadata = {
  title: "Crear cuenta",
}

export default function RegistroPage() {
  return (
    <AuthCard back={{ href: "/", label: "Volver al inicio" }}>
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Creá tu negocio</h1>
        <p className="mt-1.5 text-[13px] text-neutral-500">
          Tu cuenta y tu negocio se crean juntos. Después cargás sucursales y servicios.
        </p>
      </div>
      <RegisterForm />
    </AuthCard>
  )
}
