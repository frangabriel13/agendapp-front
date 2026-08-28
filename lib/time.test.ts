import { afterEach, describe, expect, it, vi } from "vitest"
import {
  businessNow,
  businessTimezone,
  dateToStr,
  monthRange,
  parseCalendarDay,
  setBusinessTimezone,
  splitInstant,
  toInstant,
  today,
} from "./time"

// Cada bloque fija la zona que necesita; esto la devuelve a "la del navegador".
afterEach(() => {
  setBusinessTimezone(null)
  vi.useRealTimers()
})

describe("parseCalendarDay", () => {
  it("corre en una zona con offset negativo, o no prueba nada", () => {
    // Sin esto el resto del bloque se aprueba solo: en UTC la versión con bug
    // devuelve exactamente lo mismo que la correcta. La zona la fija
    // `vitest.config.mts`; esta aserción avisa si alguien la saca.
    expect(new Date().getTimezoneOffset()).toBeGreaterThan(0)
  })

  it("interpreta el día en hora local, no en UTC", () => {
    // `new Date("2026-12-25")` se lee como UTC y en América se corre al 24.
    const fecha = parseCalendarDay("2026-12-25")

    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(11)
    expect(fecha.getDate()).toBe(25)
  })

  it("no se corre de día en ninguna fecha del año", () => {
    for (const date of ["2026-01-01", "2026-06-30", "2026-07-01", "2026-12-31"]) {
      const [, , dia] = date.split("-").map(Number)
      expect(parseCalendarDay(date).getDate()).toBe(dia)
    }
  })

  it("es la inversa de dateToStr", () => {
    for (const date of ["2026-01-01", "2026-03-08", "2026-11-01", "2026-12-31"]) {
      expect(dateToStr(parseCalendarDay(date))).toBe(date)
    }
  })

  /**
   * El par día-de-calendario **no mira la zona del negocio**, y no es un olvido:
   * el calendario arma sus casilleros con `new Date(año, mes, día)` —medianoche
   * local— y leerlos en una zona más atrasada los correría un día para atrás.
   */
  it("sigue siendo local aunque el negocio esté en otra zona", () => {
    setBusinessTimezone("Asia/Tokyo")

    expect(dateToStr(parseCalendarDay("2026-09-07"))).toBe("2026-09-07")
  })
})

describe("setBusinessTimezone", () => {
  it("sin zona del negocio usa la del navegador", () => {
    expect(businessTimezone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
  })

  it("toma la que le den", () => {
    setBusinessTimezone("America/Mexico_City")

    expect(businessTimezone()).toBe("America/Mexico_City")
  })

  /**
   * Una zona que `Intl` no conoce tira excepción, y eso dejaría a la app sin poder
   * dibujar una sola fecha. Volver a la del navegador es incorrecto pero
   * infinitamente mejor que una pantalla en blanco.
   */
  it("ignora una zona inválida en vez de romper toda la app", () => {
    setBusinessTimezone("Marte/Olympus_Mons")

    expect(businessTimezone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
    expect(() => splitInstant("2026-09-07T12:00:00.000Z")).not.toThrow()
  })
})

/**
 * Los tests corren con `TZ=America/Argentina/Buenos_Aires` (UTC−3), fijada en
 * `vitest.config.mts`. Por eso los casos sin zona de negocio dan −3, y los que
 * fijan otra zona prueban justamente que **no** se usa la del navegador.
 */
describe("splitInstant", () => {
  it("parte un instante en día y hora de pared", () => {
    // 12:00 UTC son las 9 de la mañana acá.
    expect(splitInstant("2026-09-07T12:00:00.000Z")).toEqual({ day: "2026-09-07", time: "09:00" })
  })

  /**
   * La trampa que justifica la función: a la mañana temprano, UTC ya está en el
   * día siguiente. Usar la parte de fecha del ISO movería el turno un día.
   */
  it("usa el día local, no el del ISO", () => {
    // 02:00 UTC del 8 son las 23:00 del 7 acá.
    expect(splitInstant("2026-09-08T02:00:00.000Z")).toEqual({ day: "2026-09-07", time: "23:00" })
  })

  /**
   * El bug del punto 16: la máquina de desarrollo está en UTC y el panel mostraba
   * todo corrido tres horas. Con la zona del negocio fijada, la del navegador deja
   * de importar.
   */
  it("usa la zona del negocio, no la del navegador", () => {
    setBusinessTimezone("America/Mexico_City") // UTC−6 en septiembre

    expect(splitInstant("2026-09-07T12:00:00.000Z")).toEqual({ day: "2026-09-07", time: "06:00" })
  })

  it("cruza el día para el otro lado en una zona adelantada", () => {
    setBusinessTimezone("Asia/Tokyo") // UTC+9

    expect(splitInstant("2026-09-07T20:00:00.000Z")).toEqual({ day: "2026-09-08", time: "05:00" })
  })
})

describe("toInstant", () => {
  it("es la vuelta de splitInstant", () => {
    const iso = toInstant("2026-09-07", "09:00")

    expect(splitInstant(iso)).toEqual({ day: "2026-09-07", time: "09:00" })
  })

  it("interpreta la hora en la zona local, no en UTC", () => {
    expect(toInstant("2026-09-07", "09:00")).toBe("2026-09-07T12:00:00.000Z")
  })

  it("interpreta la hora en la zona del negocio", () => {
    setBusinessTimezone("America/Mexico_City")

    expect(toInstant("2026-09-07", "09:00")).toBe("2026-09-07T15:00:00.000Z")
  })

  it("cierra el ida y vuelta en varias zonas y varias fechas", () => {
    for (const zona of ["America/Argentina/Buenos_Aires", "America/Mexico_City", "Europe/Madrid", "Asia/Tokyo", "America/Santiago"]) {
      setBusinessTimezone(zona)
      for (const day of ["2026-01-15", "2026-03-29", "2026-06-30", "2026-10-25", "2026-12-31"]) {
        for (const time of ["00:30", "09:00", "13:45", "23:30"]) {
          const vuelta = splitInstant(toInstant(day, time))
          expect(`${zona} ${day} ${time} → ${vuelta.day} ${vuelta.time}`).toBe(
            `${zona} ${day} ${time} → ${day} ${time}`,
          )
        }
      }
    }
  })

  /**
   * **El caso que obliga a medir el desfase dos veces.** Madrid pasa de UTC+1 a
   * UTC+2 el 29 de marzo a las 02:00. Suponiendo que la hora de pared es UTC, la
   * primera medición cae del lado equivocado del salto y devuelve el desfase de
   * invierno; la segunda lo mide en el instante ya corregido.
   */
  it("no se corre una hora en el fin de semana del cambio de hora", () => {
    setBusinessTimezone("Europe/Madrid")

    // 04:00 del domingo del cambio ya está en horario de verano: UTC+2.
    expect(toInstant("2026-03-29", "04:00")).toBe("2026-03-29T02:00:00.000Z")
    // El día anterior sigue en invierno: UTC+1.
    expect(toInstant("2026-03-28", "04:00")).toBe("2026-03-28T03:00:00.000Z")
  })

  /**
   * **Este es el caso que obliga a medir dos veces**, y ningún otro lo agarra.
   *
   * Madrid salta a las 02:00 del 29 de marzo (01:00 UTC). Las 01:30 de esa
   * madrugada todavía son de invierno, UTC+1, o sea las 00:30 UTC. Pero la
   * primera medición supone que "01:30" es UTC, y a las 01:30 UTC Madrid **ya
   * saltó**: mide +2 y devuelve las 23:30 del día anterior. Una hora de menos y
   * un día de menos, para un turno cargado a las 01:30.
   */
  it("acierta en la hora anterior al salto, donde una sola medición falla", () => {
    setBusinessTimezone("Europe/Madrid")

    expect(toInstant("2026-03-29", "01:30")).toBe("2026-03-29T00:30:00.000Z")
    expect(splitInstant("2026-03-29T00:30:00.000Z")).toEqual({
      day: "2026-03-29",
      time: "01:30",
    })
  })

  /**
   * El mismo salto del lado de acá, con el signo del desfase al revés: Chile pasa
   * de UTC−4 a UTC−3 a la medianoche del 6 de septiembre. Las 01:30 ya son de
   * verano; una sola medición las guardaría a las 05:30 UTC —las 02:30 de allá.
   */
  it("acierta también en el hemisferio sur", () => {
    setBusinessTimezone("America/Santiago")

    expect(toInstant("2026-09-06", "01:30")).toBe("2026-09-06T04:30:00.000Z")
    expect(splitInstant("2026-09-06T04:30:00.000Z")).toEqual({
      day: "2026-09-06",
      time: "01:30",
    })
  })

  /**
   * Una hora que **no existe** —la que el reloj se saltea— no puede volver igual,
   * y no es un bug: es una hora que nadie puede cargar. Lo que sí tiene que pasar
   * es que dé un instante real y cercano, no una fecha corrida ni un `Invalid
   * Date`.
   */
  it("con una hora que el reloj se saltea devuelve un instante válido", () => {
    setBusinessTimezone("America/Santiago")

    const iso = toInstant("2026-09-06", "00:30") // esa medianoche no existe allá

    expect(new Date(iso).getTime()).not.toBeNaN()
    expect(splitInstant(iso).day).toBe("2026-09-05")
  })

  it("tampoco en el cambio de octubre, que va para el otro lado", () => {
    setBusinessTimezone("Europe/Madrid")

    expect(toInstant("2026-10-25", "04:00")).toBe("2026-10-25T03:00:00.000Z")
    expect(toInstant("2026-10-24", "04:00")).toBe("2026-10-24T02:00:00.000Z")
  })
})

describe("today", () => {
  it("es el día del negocio, no el del navegador", () => {
    vi.useFakeTimers()
    // 01:00 UTC del 28: en Buenos Aires todavía es el 27.
    vi.setSystemTime(new Date("2026-08-28T01:00:00.000Z"))

    setBusinessTimezone("America/Argentina/Buenos_Aires")
    expect(today()).toBe("2026-08-27")

    setBusinessTimezone("Asia/Tokyo")
    expect(today()).toBe("2026-08-28")
  })
})

describe("businessNow", () => {
  /**
   * Está corrido a propósito: todo lo que dibuja la agenda —la línea de "ahora",
   * qué turno está en curso— lee `getHours()` y `dateToStr()`, y así funciona sin
   * que ningún componente sepa de zonas.
   */
  it("se lee con los getters locales y da la hora del negocio", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-27T19:00:00.000Z"))
    setBusinessTimezone("America/Argentina/Buenos_Aires")

    const ahora = businessNow()

    expect(ahora.getHours()).toBe(16)
    expect(dateToStr(ahora)).toBe("2026-08-27")
  })

  it("en una zona adelantada cae en el día siguiente", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-27T19:00:00.000Z"))
    setBusinessTimezone("Asia/Tokyo")

    const ahora = businessNow()

    expect(ahora.getHours()).toBe(4)
    expect(dateToStr(ahora)).toBe("2026-08-28")
  })

  it("coincide con today()", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-28T02:30:00.000Z"))

    for (const zona of ["America/Argentina/Buenos_Aires", "Asia/Tokyo", "America/Mexico_City"]) {
      setBusinessTimezone(zona)
      expect(dateToStr(businessNow())).toBe(today())
    }
  })
})

describe("monthRange", () => {
  it("toma el mes entero, del 1 al último", () => {
    expect(monthRange("2026-08")).toEqual({ from: "2026-08-01", to: "2026-08-31" })
  })

  it("no se le escapa el día 30 de un mes de 30", () => {
    expect(monthRange("2026-09")).toEqual({ from: "2026-09-01", to: "2026-09-30" })
  })

  it("febrero de un año bisiesto llega al 29", () => {
    expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" })
  })

  it("y de uno común, al 28", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" })
  })

  it("diciembre termina en diciembre, no en enero", () => {
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" })
  })

  it("no depende de la zona del negocio: son días de calendario", () => {
    setBusinessTimezone("Asia/Tokyo")
    const tokio = monthRange("2026-08")
    setBusinessTimezone("America/Mexico_City")

    expect(monthRange("2026-08")).toEqual(tokio)
  })
})
