"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Eye, Server, FileText, Database, UserCheck } from "lucide-react"
import { useSettings } from "@/context/settings"
import { Header } from "@/components/header"

export default function CoverisePrivacyPolicyPage() {
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header />

      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10 sm:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-full text-sm font-semibold mb-4 shadow-lg shadow-cyan-500/20 backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              Legal Document
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-balance drop-shadow-2xl">
              Our{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto text-pretty">
              Your privacy and data protection rights explained clearly.
            </p>
            <div className="text-sm text-cyan-400 pt-2">
              Last Updated:{" "}
              {settings?.general?.effectiveDate
                ? new Date(settings.general.effectiveDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "11 November, 2025"}
            </div>
          </div>          <div className="grid grid-cols-1 gap-8 sm:gap-10">
            {/* Section 1 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      1
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Introduction and Data Controller</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    {settings?.general?.siteName || "Coverise"}, operated by{" "}
                    {settings?.general?.companyName || "Letterise Ltd (16875214)"} (registered in England and Wales at{" "}
                    {settings?.general?.companyAddress || "128 City Road, London, EC1V 2NX"}), is committed to
                    protecting and respecting your privacy. This Privacy Policy explains how we collect, use, disclose,
                    and safeguard your personal information when you access or use our services (the "Services") through
                    our website and platform.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    This Privacy Policy applies to all users of our Services and governs our data practices in
                    accordance with applicable data protection laws, including the UK General Data Protection Regulation
                    (UK GDPR), the Data Protection Act 2018, and other relevant privacy legislation.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Information We Collect</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-blue-300">2.1 Personal Information You Provide</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Account registration details
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Contact form submissions
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Payment information
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Service requests
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Customer support communications
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Feedback and survey responses
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-green-300">2.2 Information Collected Automatically</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Device and browser information
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          IP address and location data
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Usage patterns and analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Cookies and tracking technologies
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      3
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Legal Basis for Processing</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-purple-300">Contract Performance</h4>
                    </div>
                    <p className="text-sm text-gray-400">Processing necessary to provide our services</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-xl p-5 border border-orange-500/30 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-orange-300">Legitimate Interests</h4>
                    </div>
                    <p className="text-sm text-gray-400">Service improvement, security, and business operations</p>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/30 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-red-300">Legal Compliance</h4>
                    </div>
                    <p className="text-sm text-gray-400">
                      Compliance with applicable laws and regulatory requirements
                    </p>
                  </div>
                  <div className="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/30 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-indigo-300">Consent</h4>
                    </div>
                    <p className="text-sm text-gray-400">
                      Where you have provided explicit consent for specific activities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      4
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">How We Use Your Information</h2>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-cyan-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Server className="w-6 h-6 text-cyan-400" />
                        <h4 className="text-lg font-semibold text-white">Service Provision</h4>
                      </div>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Service delivery and fulfillment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Account management and authentication</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Payment processing and billing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Customer support and assistance</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <h4 className="text-lg font-semibold text-white">Business Operations</h4>
                      </div>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Service improvement and optimization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Security monitoring and fraud prevention</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Analytics and performance tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Marketing communications (with consent)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      5
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Your Rights</h2>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">Under UK GDPR, you have the following rights:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <h4 className="font-semibold text-green-300 mb-2">Right to Access</h4>
                    <p className="text-sm text-gray-400">Request copies of your personal data</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <h4 className="font-semibold text-blue-300 mb-2">Right to Rectification</h4>
                    <p className="text-sm text-gray-400">Correct inaccurate information</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <h4 className="font-semibold text-red-300 mb-2">Right to Erasure</h4>
                    <p className="text-sm text-gray-400">Request deletion of your data</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="font-semibold text-purple-300 mb-2">Right to Object</h4>
                    <p className="text-sm text-gray-400">Object to processing of your data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      6
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h2>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">
                  If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                </p>
                <Link href="/contact">
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-cyan-600/20">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              COVERISE
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <a href="/privacy-policy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-services" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Terms of Service
              </a>
              <a href="/return-policy" className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">
                Return Policy
              </a>
            </div>
            <p className="text-gray-600 text-sm">&copy; 2025 Coverise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
