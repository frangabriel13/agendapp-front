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

/** Espeja la regla del backend para registro y cambio de contraseña. */
export function validateNewPassword(password: string): string | null {
  if (!password) return "La contraseña es requerida"
  if (password.length < 8) return "Debe tener al menos 8 caracteres"
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    return "Debe incluir al menos una letra y un número"
  }
  return null
}
