import type { Availability } from "@/types"

/**
 * Por qué no hay horarios para ofrecer.
 *
 * `slots: []` tiene **tres** motivos y el cartel que corresponde es distinto en
 * cada uno. El que hay que distinguir sí o sí es `noEmployeeForServices`: es el
 * único que **no se arregla cambiando de día**, así que ofrecer "probá otro día"
 * ahí manda a la persona a un callejón sin salida.
 *
 * Los dos flags son independientes y pueden venir los dos en `true`. Cuando pasa
 * gana el de nadie-lo-presta, por lo mismo: la sucursal cerrada se destraba
 * cambiando de día y el otro no.
 */
export function motivoSinHorarios(
  disponibilidad: Pick<Availability, "branchClosed" | "noEmployeeForServices">,
  cantidadServicios: number,
): string {
  if (disponibilidad.noEmployeeForServices) {
    // El turno lo atiende una sola persona, así que con varios servicios lo que
    // falta no es quién haga cada uno: es quién los haga todos.
    return cantidadServicios > 1
      ? "Nadie en esta sucursal hace todos esos servicios juntos. Cambiar de día no ayuda: sacá alguno, probá otra sucursal o asignáselos a alguien del equipo."
      : "Nadie presta ese servicio en esta sucursal. Cambiar de día no ayuda: probá otra sucursal o asignáselo a alguien del equipo."
  }

  if (disponibilidad.branchClosed) return "Ese día la sucursal está cerrada."

  return "No queda ningún horario libre ese día."
}
