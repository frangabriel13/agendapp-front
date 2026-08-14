import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

// Se prueba contra un backend HTTP falso en vez de mockear fetch: así entran en
// el test el timeout, la cancelación y los sockets cortados, que con un mock de
// fetch habría que simular a mano y dejarían de parecerse a la realidad.

type Route = (req: IncomingMessage, res: ServerResponse) => void

let route: Route = (_req, res) => res.end()
const server: Server = createServer((req, res) => route(req, res))
const store = new Map<string, string>()

let api!: typeof import("./api")

const TOKENS = {
  accessToken: "access-0",
  refreshToken: "refresh-0",
  tokenType: "Bearer",
  expiresIn: 900,
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

function unauthorized(res: ServerResponse) {
  json(res, 401, { statusCode: 401, message: "Unauthorized", error: "Unauthorized" })
}

async function catchApiError(promise: Promise<unknown>) {
  const error = await promise.then(() => null).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(api.ApiError)
  return error as InstanceType<typeof api.ApiError>
}

beforeAll(async () => {
  // lib/api.ts está escrito para el browser; acá corre en Node.
  vi.stubGlobal("window", globalThis)
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })

  await new Promise<void>((resolve) => server.listen(0, resolve))
  // API_URL se lee al importar el módulo, así que el import va después.
  process.env.NEXT_PUBLIC_API_URL = `http://localhost:${(server.address() as AddressInfo).port}`
  api = await import("./api")
})

afterAll(() => {
  server.close()
  vi.unstubAllGlobals()
})

afterEach(() => store.clear())

describe("respuestas", () => {
  it("devuelve el body parseado en un 200", async () => {
    route = (_req, res) => json(res, 200, { businessName: "Peluquería Demo" })

    await expect(api.apiFetch("/tenants/me", {}, { auth: false })).resolves.toEqual({
      businessName: "Peluquería Demo",
    })
  })

  it("devuelve undefined en un 204 sin intentar parsear", async () => {
    route = (_req, res) => {
      res.writeHead(204)
      res.end()
    }

    await expect(
      api.apiFetch("/branches/abc", { method: "DELETE" }, { auth: false }),
    ).resolves.toBeUndefined()
  })
})

describe("errores", () => {
  it("normaliza el message array de validación a ApiError.messages", async () => {
    route = (_req, res) =>
      json(res, 400, {
        statusCode: 400,
        message: ["El email no tiene un formato válido", "La contraseña es muy corta"],
        error: "Bad Request",
        requestId: "req-1",
      })

    const error = await catchApiError(
      api.apiFetch("/auth/register", { method: "POST", body: "{}" }, { auth: false }),
    )

    expect(error.statusCode).toBe(400)
    expect(error.messages).toEqual([
      "El email no tiene un formato válido",
      "La contraseña es muy corta",
    ])
    expect(error.requestId).toBe("req-1")
  })

  it("normaliza el message string a un array de uno", async () => {
    route = (_req, res) =>
      json(res, 409, { statusCode: 409, message: "Ya existe una sucursal con ese nombre", error: "Conflict" })

    const error = await catchApiError(api.apiFetch("/branches", { method: "POST" }, { auth: false }))

    expect(error.messages).toEqual(["Ya existe una sucursal con ese nombre"])
  })

  it("corta con timeout si el backend acepta la conexión y no responde", async () => {
    route = () => {} // nunca responde

    const error = await catchApiError(api.apiFetch("/auth/me", {}, { auth: false, timeoutMs: 80 }))

    expect(error.messages[0]).toMatch(/tardó demasiado/)
  })

  it("avisa de error de conexión si se corta el socket", async () => {
    route = (req) => req.destroy()

    const error = await catchApiError(api.apiFetch("/auth/me", {}, { auth: false }))

    expect(error.messages[0]).toMatch(/No pudimos conectarnos/)
  })

  it("propaga la cancelación del llamador sin envolverla en ApiError", async () => {
    // React Query aborta al desmontar: tiene que verlo como cancelación, no como fallo.
    route = () => {}
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 30)

    const error = await api
      .apiFetch("/auth/me", { signal: controller.signal }, { auth: false })
      .then(() => null)
      .catch((e: unknown) => e)

    expect(error).not.toBeInstanceOf(api.ApiError)
    expect((error as Error).name).toBe("AbortError")
  })
})

describe("refresh de sesión", () => {
  it("refresca y reintenta cuando el access token venció", async () => {
    api.storeTokens(TOKENS)
    route = (req, res) => {
      if (req.url === "/auth/refresh") {
        return json(res, 200, { ...TOKENS, accessToken: "access-1", refreshToken: "refresh-1" })
      }
      if (req.headers.authorization !== "Bearer access-1") return unauthorized(res)
      json(res, 200, { user: { email: "dueno@demo.test" } })
    }

    await expect(api.apiFetch("/auth/me")).resolves.toEqual({
      user: { email: "dueno@demo.test" },
    })
    expect(store.get("accessToken")).toBe("access-1")
    expect(store.get("refreshToken")).toBe("refresh-1")
  })

  it("limpia la sesión si el refresh falla", async () => {
    api.storeTokens(TOKENS)
    route = (_req, res) => unauthorized(res)

    const error = await catchApiError(api.apiFetch("/auth/me"))

    expect(error.statusCode).toBe(401)
    expect(api.hasStoredToken()).toBe(false)
  })

  it("limpia la sesión si el reintento sigue dando 401", async () => {
    // Sesión revocada o empleado desactivado: el token es nuevo pero ya no vale.
    // Sin limpiar, hasStoredToken() seguiría en true y la app creería que hay sesión.
    api.storeTokens(TOKENS)
    route = (req, res) => {
      if (req.url === "/auth/refresh") return json(res, 200, { ...TOKENS, accessToken: "access-1" })
      unauthorized(res)
    }

    const error = await catchApiError(api.apiFetch("/auth/me"))

    expect(error.statusCode).toBe(401)
    expect(error.messages[0]).toMatch(/sesión expiró/)
    expect(api.hasStoredToken()).toBe(false)
  })

  it("hace un solo refresh aunque cuatro requests reciban 401 escalonados", async () => {
    // El backend rota el refresh token en cada uso: de más, son round trips y
    // rotaciones al pedo, y entre pestañas puede revocar la sesión entera.
    // Los 401 van escalonados a propósito: si llegaran todos juntos, el guard
    // `refreshInFlight` alcanzaría solo y el test pasaría sin probar nada.
    api.storeTokens(TOKENS)
    let refreshes = 0
    let pending = 0
    route = (req, res) => {
      if (req.url === "/auth/refresh") {
        refreshes += 1
        return json(res, 200, {
          ...TOKENS,
          accessToken: `access-${refreshes}`,
          refreshToken: `refresh-${refreshes}`,
        })
      }
      if (req.headers.authorization === `Bearer ${TOKENS.accessToken}`) {
        pending += 1
        const delay = pending * 60
        setTimeout(() => unauthorized(res), delay)
        return
      }
      json(res, 200, { ok: true })
    }

    await Promise.all(Array.from({ length: 4 }, () => api.apiFetch("/auth/me")))

    expect(refreshes).toBe(1)
  })
})
