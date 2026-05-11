"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { loginRequest, type LoginCredentials } from "@/services/auth"
import type { User } from "@/types"

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginRequest(credentials),
    onSuccess: (data) => {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      router.push("/dashboard")
    },
  })
}

export function useLogout() {
  const router = useRouter()

  return () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}
