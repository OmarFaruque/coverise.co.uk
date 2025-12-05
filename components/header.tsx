"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/context/auth"
import { usePathname } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const [hideContactLink, setHideContactLink] = useState(false)
  const [hideDocumentsLink, setHideDocumentsLink] = useState(false)

  useEffect(() => {
    if (!pathname) return
    setHideContactLink(
      pathname === "/contact" ||
        pathname === "/privacy-policy" ||
        pathname === "/terms-of-services" ||
        pathname === "/return-policy",
    )
    setHideDocumentsLink(pathname === "/ai-documents")
  }, [pathname])

  return (
    <header className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
          >
            COVERISE
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex gap-6 items-center" role="navigation">
            {!hideDocumentsLink && (
              <Link
                href="/ai-documents"
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
            )}
            {!hideContactLink && (
              <Link href="/contact" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-sm">
                Contact
              </Link>
            )}
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-cyan-600/20">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-cyan-600/20">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="sm:hidden p-2 text-cyan-400 hover:bg-gray-900 rounded-lg transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
            {!hideDocumentsLink && (
              <Link href="/ai-documents" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Documents</div>
              </Link>
            )}
            {!hideContactLink && (
              <Link href="/contact" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-cyan-400 transition-colors font-medium py-2">Contact</div>
              </Link>
            )}
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}