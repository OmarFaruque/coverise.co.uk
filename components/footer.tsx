"use client"

import { useSettings } from "@/context/settings"
import Link from "next/link"

export function Footer() {
  const settings = useSettings()

  return (
    <footer className="bg-black border-t border-gray-900 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
            COVERISE
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            <Link href="/privacy-policy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-services" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/return-policy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
              Return Policy
            </Link>
          </div>
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} {settings?.companyName || "COVERISE"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}