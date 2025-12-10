import { getSettings } from "@/lib/database"
import AdminLoginClient from "@/components/auth/admin-login-client"

export default async function AdminLoginPage() {
  const generalSettings = await getSettings("general")
  return <AdminLoginClient generalSettings={generalSettings} />
}