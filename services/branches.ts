import { apiFetch } from "@/lib/api"
import type { Branch } from "@/types"

export function listBranchesRequest(): Promise<Branch[]> {
  return apiFetch<Branch[]>("/branches")
}
