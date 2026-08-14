/**
 * Precio en la moneda del mercado.
 *
 * Sin decimales a propósito: los precios de los servicios son montos redondos y
 * los centavos solo agregan ruido.
 *
 * Pendiente: la moneda debería salir de `tenant.currency` en vez de estar fija.
 * Hoy no hay forma de leerla sin volver el helper un hook, y todos los usos
 * están en pantallas del panel de un negocio argentino.
 */
export function formatPrice(price: number, currency = "ARS"): string {
  return price.toLocaleString("es-AR", { style: "currency", currency, maximumFractionDigits: 0 })
}
