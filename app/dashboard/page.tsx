"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
import { PoliciesSection } from "@/components/dashboard/policies-section"
import { AccountSection } from "@/components/dashboard/account-section"
import { UserTicketsSection } from "@/components/dashboard/user-tickets-section"
import { LogoutDialog } from "@/components/dashboard/logout-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth"
import { LogOut, ShieldCheck, User, MessageSquare } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Footer } from "@/components/footer"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<"policies" | "account" | "tickets">("policies")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const { notifications, removeNotification, showSuccess } = useNotifications()
  const router = useRouter()
  const { isAuthenticated, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-cyan-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    logout()
    showSuccess("Logged Out Successfully", "You have been logged out of your account.", 5000)
    setShowLogoutDialog(false)
  }

  const renderSection = () => {
    switch (activeSection) {
      case "policies":
        return <PoliciesSection />
      case "account":
        return <AccountSection />
      case "tickets":
        return <UserTicketsSection />
      default:
        return <PoliciesSection />
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DashboardHeader onLogoutClick={() => setShowLogoutDialog(true)} />

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg p-4 sticky top-24">
              <nav className="flex flex-col gap-2">
                <Button
                  onClick={() => setActiveSection("policies")}
                  className={`justify-start gap-3 text-base font-medium transition-colors ${
                    activeSection === "policies"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  variant="ghost"
                >
                  <ShieldCheck className="w-5 h-5" />
                  My Documents
                </Button>
                <Button
                  onClick={() => setActiveSection("tickets")}
                  className={`justify-start gap-3 text-base font-medium transition-colors ${
                    activeSection === "tickets"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  variant="ghost"
                >
                  <MessageSquare className="w-5 h-5" />
                  My Tickets
                </Button>
                <Button
                  onClick={() => setActiveSection("account")}
                  className={`justify-start gap-3 text-base font-medium transition-colors ${
                    activeSection === "account"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  variant="ghost"
                >
                  <User className="w-5 h-5" />
                  My Account
                </Button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6 min-h-[600px]">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>

      <Footer />

      <LogoutDialog isOpen={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} onConfirm={handleLogout} />
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  )
}
