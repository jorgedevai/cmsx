import { RequireAdmin } from "@/components/require-admin"

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>
}
