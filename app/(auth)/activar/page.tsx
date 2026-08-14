import { Suspense } from "react"
import { AuthCard } from "@/features/auth/components/AuthCard"
import { ActivateAccountForm } from "@/features/employees/components/ActivateAccountForm"

export const metadata = {
  title: "Activar cuenta",
  // El link es de un solo uso y lleva un token: no tiene sentido indexarlo.
  robots: { index: false, follow: false },
}

export default function ActivarPage() {
  return (
    <AuthCard back={{ href: "/login", label: "Ir al login" }}>
      {/*
        El token se lee en el cliente con `useSearchParams`, lo que obliga a este
        límite de Suspense. Además es lo correcto para un secreto de un solo uso:
        leerlo en el servidor lo haría viajar dentro del payload de la página.
      */}
      <Suspense fallback={<FormSkeleton />}>
        <ActivateAccountForm />
      </Suspense>
    </AuthCard>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="mx-auto h-5 w-40 animate-pulse rounded bg-neutral-100" />
      <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-10 animate-pulse rounded-full bg-neutral-100" />
    </div>
  )
}
