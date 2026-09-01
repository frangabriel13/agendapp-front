"use client"

import { Loader2, MailCheck, MailWarning, RotateCw } from "lucide-react"
import { cta } from "@/components/CtaLink"
import { cn } from "@/lib/utils"
import { apiErrorMessage } from "@/lib/errors"
import { ApiError } from "@/lib/api"
import { useResendVerification, useSession } from "../hooks/useAuth"

/**
 * "Todavía no confirmaste tu email", con el botón para que llegue de nuevo.
 *
 * **Existe porque sin esto no hay forma de pedir el mail otra vez.** Confirmar se
 * hace abriendo el link (`/verificar-email?token=`), así que si ese mail no llegó
 * —spam, dirección tipeada mal, un rato sin internet— la cuenta se quedaba sin
 * confirmar para siempre y sin nada que apretar.
 *
 * **Es de la persona, no del negocio**: `emailVerifiedAt` vive en `user`, así que
 * cada empleado ve el suyo y nadie ve el de otro.
 *
 * **Hoy no bloquea nada y por eso el cartel es informativo, no una barrera.** Va
 * en Inicio y no en todas las pantallas: repetir en cada vista un aviso que no
 * impide trabajar es ruido, y quien acaba de registrarse cae justo acá.
 */
export function VerifyEmailNotice() {
  const { data: session } = useSession()
  const reenvio = useResendVerification()

  // Mientras la sesión no llegó no se afirma nada: dibujar el aviso y sacarlo
  // medio segundo después es peor que esperar.
  if (!session || session.user.emailVerifiedAt !== null) return null

  // Un 409 quiere decir que ya estaba confirmado. El hook refresca la sesión, así
  // que este componente se desmonta solo; no hay que contarlo como falla.
  const fallo =
    reenvio.error && !(reenvio.error instanceof ApiError && reenvio.error.statusCode === 409)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      {reenvio.isSuccess ? (
        <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-amber-900">
          <MailCheck size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          {/*
            Se nombra la dirección a la que se mandó: si el mail no llega, lo más
            probable es que esté mal escrita, y verla es la única forma de darse
            cuenta. Corregirla no se puede desde acá todavía.
          */}
          <span>
            Te lo mandamos a <span className="font-medium">{session.user.email}</span>. Si no
            aparece, mirá en spam.
          </span>
        </p>
      ) : (
        <>
          <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-amber-900">
            <MailWarning size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <span>
              Todavía no confirmaste <span className="font-medium">{session.user.email}</span>.
              Podés seguir usando el panel igual.
            </span>
          </p>

          <button
            type="button"
            onClick={() => reenvio.mutate()}
            disabled={reenvio.isPending}
            className={cn(cta({ variant: "outline", size: "sm" }), "shrink-0 bg-white/70")}
          >
            {reenvio.isPending ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <RotateCw size={14} aria-hidden />
            )}
            {reenvio.isPending ? "Enviando…" : "Reenviar el mail"}
          </button>
        </>
      )}

      {fallo && (
        <p role="alert" className="w-full text-[13px] text-red-600">
          {apiErrorMessage(reenvio.error, "No pudimos reenviarlo. Probá de nuevo en un momento.")}
        </p>
      )}
    </div>
  )
}
