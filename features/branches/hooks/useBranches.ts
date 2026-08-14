"use client"

import { useQuery } from "@tanstack/react-query"
import { listBranchesRequest } from "@/services/branches"

export const BRANCHES_KEY = ["branches"] as const

export function useBranches() {
  return useQuery({
    queryKey: BRANCHES_KEY,
    queryFn: listBranchesRequest,
    // Las sucursales cambian poquísimo y varias pantallas las piden.
    staleTime: 5 * 60_000,
  })
}
