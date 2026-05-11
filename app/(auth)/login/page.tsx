import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata = {
  title: "Ingresar — AgendApp",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="inline-block w-10 h-10 rounded-xl bg-violet-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">AgendApp</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresá a tu panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
