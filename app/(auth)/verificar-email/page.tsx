import { Suspense } from "react"
import { AuthCard } from "@/features/auth/components/AuthCard"
import { VerifyEmailCard } from "@/features/auth/components/VerifyEmailCard"

export const metadata = {
  title: "Confirmar email",
  // El link es de un solo uso y lleva un token: no tiene sentido indexarlo.
  robots: { index: false, follow: false },
}

export default function VerificarEmailPage() {
  return (
    <AuthCard back={{ href: "/login", label: "Ir al login" }}>
      {/*
        El token se lee en el cliente con `useSearchParams`, lo que obliga a este
        límite de Suspense. Además es lo correcto para un secreto de un solo uso:
        leerlo en el servidor lo haría viajar dentro del payload de la página.
      */}
      <Suspense fallback={<CardSkeleton />}>
        <VerifyEmailCard />
      </Suspense>
    </AuthCard>
  )
}

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="size-12 animate-pulse rounded-full bg-neutral-100" />
      <div className="h-5 w-44 animate-pulse rounded bg-neutral-100" />
      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
    </div>
  )
}
