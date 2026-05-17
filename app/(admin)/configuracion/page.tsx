import { Settings } from "lucide-react"
import { ComingSoon } from "../components/ComingSoon"

export const metadata = {
  title: "Configuración",
}

export default function ConfiguracionPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Sucursales, servicios y equipos de tu estética"
      bullets={[
        "Sucursales y datos del negocio",
        "Catálogo de servicios y precios",
        "Equipos (HIFU, Liposonix, etc.)",
        "Recordatorios por WhatsApp",
      ]}
    />
  )
}
