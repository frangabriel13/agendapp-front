import type { LucideIcon } from "lucide-react"

interface Props {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}

export function ComingSoon({ icon: Icon, title, description, bullets }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-gray-500 text-sm mb-8">{description}</p>

      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <Icon size={22} className="text-violet-600" />
        </div>
        <p className="font-semibold text-gray-900 mb-1">Próximamente</p>
        <p className="text-sm text-gray-500 mb-6">Esta sección está en construcción. Va a incluir:</p>
        <ul className="text-sm text-left space-y-2 inline-block">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-gray-600">
              <span className="text-violet-500 mt-0.5">•</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
