import { RequireAdmin } from "@/components/require-admin"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>
}
