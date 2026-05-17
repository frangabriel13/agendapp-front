import Image from "next/image"
import Link from "next/link"
import { Clock } from "lucide-react"

export const metadata = {
  title: "Crear cuenta",
}

export default function RegistroPage() {
  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-4 text-center">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors">
          ← Volver al inicio
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <Link href="/">
          <Image src="/loguito.png" alt="reservApp" width={120} height={120} className="mx-auto mb-2 rounded-xl" />
        </Link>

        <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto my-4">
          <Clock size={22} className="text-violet-600" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Registro próximamente</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Estamos terminando el alta de cuentas. Mientras tanto, escribinos y te damos acceso para probar reservApp.
        </p>

        <Link
          href="/#contacto"
          className="block w-full py-2.5 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors mb-3"
        >
          Quiero que me avisen
        </Link>
        <Link href="/login" className="text-sm text-violet-600 font-medium hover:underline">
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  )
}
