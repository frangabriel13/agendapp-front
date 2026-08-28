import { z } from "zod"

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "El email es requerido"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El email no es válido"
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es requerida"
  if (password.length < 6) return "Debe tener al menos 6 caracteres"
  return null
}

/**
 * Nombre, apellido o nombre del negocio.
 *
 * **Espeja el mínimo de dos caracteres del backend**, y existe sobre todo por el
 * idioma: sin esto el rebote llega como "firstName must be longer than or equal
 * to 2 characters", que sería lo único en inglés que ve alguien creando su
 * cuenta. `que` es el sujeto de la frase ("El nombre", "El apellido").
 */
export function validateNombre(valor: string, que: string): string | null {
  const limpio = valor.trim()
  if (!limpio) return `${que} es requerido`
  if (limpio.length < 2) return `${que} es demasiado corto`
  return null
}

/** Espeja la regla del backend para registro y cambio de contraseña. */
export function validateNewPassword(password: string): string | null {
  if (!password) return "La contraseña es requerida"
  if (password.length < 8) return "Debe tener al menos 8 caracteres"
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    return "Debe incluir al menos una letra y un número"
  }
  return null
}

/**
 * "Elegí una contraseña y repetila", que son dos pantallas: activar una cuenta
 * de empleado y restablecer la propia.
 *
 * Vive acá y no en cada formulario porque las dos mandan la contraseña al mismo
 * backend con la misma regla. Con una copia por pantalla, el día que el backend
 * pida un símbolo se actualiza una y la otra sigue dejando pasar contraseñas que
 * el servidor rechaza.
 */
export const newPasswordSchema = z
  .object({
    password: z.string().superRefine((value, ctx) => {
      const error = validateNewPassword(value)
      if (error) ctx.addIssue({ code: "custom", message: error })
    }),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })

export type NewPasswordValues = z.infer<typeof newPasswordSchema>
