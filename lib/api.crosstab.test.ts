import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * La carrera entre pestañas no se puede probar con una sola instancia del módulo:
 * `refreshInFlight` vive en el módulo, así que dos llamadas dentro del mismo
 * import se agrupan solas y el bug no aparece.
 *
 * Acá cada "pestaña" es una instancia distinta —`vi.resetModules()` entre
 * imports— que comparte `localStorage` y el `navigator.locks` global, igual que
 * dos pestañas del mismo origen comparten el almacenamiento pero no la memoria.
 */

const store = new Map<string, string>()

// ── Backend falso que rota el refresh token y castiga el reuso ──────────────
let refreshCalls = 0
let familyRevoked = false
let counter = 0
let liveRefresh = new Set<string>()
let spentRefresh = new Set<string>()
let liveAccess = new Set<string>()

function issue() {
  counter += 1
  const tokens = {
    accessToken: `access-${counter}`,
    refreshToken: `refresh-${counter}`,
    tokenType: "Bearer",
    expiresIn: 900,
  }
  liveAccess.add(tokens.accessToken)
  liveRefresh.add(tokens.refreshToken)
  return tokens
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

const unauthorized = (res: ServerResponse) =>
  json(res, 401, { statusCode: 401, message: "Unauthorized", error: "Unauthorized" })

async function readBody(req: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString() || "{}")
}

const server: Server = createServer((req, res) => {
  void (async () => {
    if (req.url === "/auth/refresh") {
      refreshCalls += 1
      const { refreshToken } = await readBody(req)

      // Reusar un refresh token ya gastado = robo de credenciales para el
      // backend real, que revoca toda la familia. Es exactamente el daño que
      // este test tiene que poder observar.
      if (refreshToken && spentRefresh.has(refreshToken)) {
        familyRevoked = true
        liveAccess.clear()
        liveRefresh.clear()
        return unauthorized(res)
      }
      if (familyRevoked || !refreshToken || !liveRefresh.has(refreshToken)) return unauthorized(res)

      liveRefresh.delete(refreshToken)
      spentRefresh.add(refreshToken)
      return json(res, 200, issue())
    }

    const token = req.headers.authorization?.replace("Bearer ", "")
    if (!token || !liveAccess.has(token)) return unauthorized(res)
    return json(res, 200, { ok: true, token })
  })()
})

/** Exclusión mutua con la misma semántica que `navigator.locks`: una a la vez, por nombre. */
function createLockManager() {
  const tails = new Map<string, Promise<unknown>>()
  return {
    request: (name: string, callback: () => Promise<unknown>) => {
      const previous = tails.get(name) ?? Promise.resolve()
      // Se encadena igual si la anterior falló: un error no debe trabar la cola.
      const result = previous.then(callback, callback)
      tails.set(
        name,
        result.then(
          () => {},
          () => {},
        ),
      )
      return result
    },
  }
}

type Api = typeof import("./api")

/** Dos instancias del módulo = dos pestañas. */
async function openTabs(): Promise<[Api, Api]> {
  vi.resetModules()
  const tabA = await import("./api")
  vi.resetModules()
  const tabB = await import("./api")
  return [tabA, tabB]
}

beforeAll(async () => {
  vi.stubGlobal("window", globalThis)
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  process.env.NEXT_PUBLIC_API_URL = `http://localhost:${(server.address() as AddressInfo).port}`
})

afterAll(() => {
  server.close()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  store.clear()
  refreshCalls = 0
  familyRevoked = false
  counter = 0
  liveRefresh = new Set(["refresh-0"])
  spentRefresh = new Set()
  // `access-0` a propósito NO está vigente: es el token vencido con el que
  // arrancan las dos pestañas, que es lo que dispara la carrera.
  liveAccess = new Set()
  store.set("accessToken", "access-0")
  store.set("refreshToken", "refresh-0")
})

afterEach(() => vi.unstubAllGlobals())

function withLocks() {
  vi.stubGlobal("window", globalThis)
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal("navigator", { locks: createLockManager() })
}

function withoutLocks() {
  withLocks()
  vi.stubGlobal("navigator", {})
}

describe("carrera de refresh entre pestañas", () => {
  it("dos pestañas que vencen a la vez refrescan una sola vez", async () => {
    withLocks()
    const [tabA, tabB] = await openTabs()

    const [a, b] = await Promise.all([
      tabA.apiFetch<{ token: string }>("/protegido"),
      tabB.apiFetch<{ token: string }>("/protegido"),
    ])

    expect(refreshCalls).toBe(1)
    expect(familyRevoked).toBe(false)
    // Las dos terminan usando el mismo token nuevo.
    expect(a.token).toBe("access-1")
    expect(b.token).toBe("access-1")
    expect(store.get("accessToken")).toBe("access-1")
  })

  it("la sesión sobrevive: el refresh token guardado sigue sirviendo", async () => {
    withLocks()
    const [tabA, tabB] = await openTabs()
    await Promise.all([tabA.apiFetch("/protegido"), tabB.apiFetch("/protegido")])

    // Si la familia se hubiera revocado, este segundo ciclo fallaría.
    liveAccess.clear()
    await expect(tabA.apiFetch<{ token: string }>("/protegido")).resolves.toMatchObject({
      token: "access-2",
    })
    expect(familyRevoked).toBe(false)
  })

  it("tres pestañas siguen disparando un solo refresh", async () => {
    withLocks()
    const [tabA, tabB] = await openTabs()
    vi.resetModules()
    const tabC = await import("./api")

    await Promise.all([tabA.apiFetch("/protegido"), tabB.apiFetch("/protegido"), tabC.apiFetch("/protegido")])

    expect(refreshCalls).toBe(1)
    expect(familyRevoked).toBe(false)
  })

  it("varias llamadas de UNA pestaña ya se agrupaban sin el lock", async () => {
    // El arreglo anterior sigue en pie: esto no depende de `navigator.locks`.
    withoutLocks()
    const [tabA] = await openTabs()

    await Promise.all([tabA.apiFetch("/protegido"), tabA.apiFetch("/protegido"), tabA.apiFetch("/protegido")])

    expect(refreshCalls).toBe(1)
    expect(familyRevoked).toBe(false)
  })

  it("sin lock, dos pestañas se pisan y el backend revoca la sesión", async () => {
    // Documenta el bug que el lock evita, y cubre el entorno sin `navigator.locks`
    // (http en una IP de red local): ahí el riesgo sigue existiendo.
    withoutLocks()
    const [tabA, tabB] = await openTabs()

    const resultados = await Promise.allSettled([tabA.apiFetch("/protegido"), tabB.apiFetch("/protegido")])

    expect(refreshCalls).toBe(2)
    expect(familyRevoked).toBe(true)
    expect(resultados.some((r) => r.status === "rejected")).toBe(true)
  })
})
