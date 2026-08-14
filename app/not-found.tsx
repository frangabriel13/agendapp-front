import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* El archivo es 1024×312: declararlo cuadrado reserva un hueco que la
          imagen no ocupa y salta el layout al cargar. */}
      <Image src="/loguito.png" alt="reservApp" width={1024} height={312} className="h-8 w-auto mb-6" />

      <p className="text-8xl font-bold text-violet-100 mb-2 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Esta página no existe</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Puede que el link esté roto o que la página haya sido eliminada.
      </p>

      <Link
        href="/"
        className="px-6 py-3 bg-violet-600 text-white rounded-md font-semibold hover:bg-violet-500 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
