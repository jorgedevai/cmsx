import { RequireAdmin } from "@/components/require-admin"

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>
}
