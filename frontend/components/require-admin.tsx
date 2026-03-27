"use client"

import { useAuthStore } from "@/store/auth"
import { useRouter } from "@/i18n/navigation"
import { useEffect } from "react"

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "Admin") {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "Admin") {
    return null
  }

  return <>{children}</>
}
