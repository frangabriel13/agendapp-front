import { Users } from "lucide-react"
import { ComingSoon } from "../components/ComingSoon"

export const metadata = {
  title: "Equipo",
}

export default function EquipoPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Equipo"
      description="Gestión de profesionales de tu estética"
      bullets={[
        "Alta y baja de profesionales",
        "Especialidad y color en la agenda",
        "Horarios y disponibilidad por persona",
        "Asignación de servicios y equipos",
      ]}
    />
  )
}
