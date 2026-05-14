import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata = {
  title: "Ingresar — reservApp",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-4 text-center">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors">
          ← Volver al inicio
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/">
            <Image src="/loguito.png" alt="reservApp" width={150} height={150} className="mx-auto mb-2 rounded-xl" />
          </Link>
          <p className="text-gray-500 text-sm mt-1">Ingresá a tu panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
