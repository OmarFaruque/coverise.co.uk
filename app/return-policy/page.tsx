"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"
import { useState } from "react"
import { useSettings } from "@/context/settings"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ReturnPolicyPage() {
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden mb-8 relative">
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, cyan 2px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl opacity-10"></div>

            <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-cyan-500/30">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Return Policy</h1>
                  <p className="text-gray-400 text-base sm:text-lg">Understanding your refund rights</p>
                </div>
              </div>

              <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
                <div className="text-xs sm:text-sm text-gray-400">
                  Last Updated:{" "}
                  {settings?.general?.effectiveDate
                    ? new Date(settings.general.effectiveDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "January 2025"}
                </div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-gray-300 leading-relaxed">
              This Return Policy governs the refund procedures for{" "}
              {settings?.general?.siteName || "Coverise"}'s digital document services.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Section 1: Overview */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Policy Overview</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Due to the digital nature of our services and immediate delivery model, we offer a{" "}
                  <strong className="text-cyan-400">14-day money-back guarantee for technical issues only</strong>.
                </p>
                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-400 mb-1">Usage Restrictions</p>
                      <p className="text-sm text-amber-300/80">
                        Our digital documents are for personal use only and have no legal validity. They cannot be used
                        in any legal proceedings or official capacity. Refunds are only provided for technical issues
                        such as download failures, corrupted files, or system errors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: 14-Day Guarantee */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">14-Day Money-Back Guarantee</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We offer a <strong className="text-cyan-400">14-day money-back guarantee</strong> if you experience
                  any of the following technical issues:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Download Failures</p>
                        <p className="text-sm text-gray-400">
                          Unable to download your document despite multiple attempts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Corrupted Files</p>
                        <p className="text-sm text-gray-400">Document file is damaged or cannot be opened</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">System Errors</p>
                        <p className="text-sm text-gray-400">Platform errors preventing document generation</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Payment Issues</p>
                        <p className="text-sm text-gray-400">Charged but document not delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Non-Refundable Circumstances */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Non-Refundable Circumstances</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Refunds will <strong className="text-red-400">NOT</strong> be provided for the following:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[ "Change of mind after successful delivery", "Dissatisfaction with document content or quality", "User errors in input specifications", "Misunderstanding of service features", "Requests submitted after 14-day window", "Documents already successfully downloaded", "Compatibility issues with user devices", "Alternative service preferences", ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Refund Request Process */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">How to Request a Refund</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 1: Contact Us</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Submit a request via our contact form within 14 days
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 2: Provide Details</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Include order number and describe the technical issue
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-5 border border-cyan-700/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-400 text-center mb-2">Step 3: Review Process</h3>
                    <p className="text-sm text-gray-400 text-center">
                      We'll review and respond within 2-3 business days
                    </p>
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Processing Time:</strong> Approved refunds are processed within 5-7 business days to your
                    original payment method.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: UK Consumer Rights */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Your UK Consumer Rights</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Under the Consumer Rights Act 2015, you are entitled to digital content that is:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">Satisfactory Quality</p>
                        <p className="text-sm text-gray-400">
                          Digital content must meet a reasonable standard of quality
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">Fit for Purpose</p>
                        <p className="text-sm text-gray-400">Suitable for its intended use and as described</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">As Described</p>
                        <p className="text-sm text-gray-400">Matches the description provided at purchase</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mt-4">
                  <p className="text-sm text-blue-300 mb-2">
                    <strong>Your Right to Remedy:</strong> If digital content is faulty, you have the right to a repair
                    or replacement. If this cannot be done or is not completed within a reasonable time, you may be
                    entitled to a price reduction or full refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6: Contact Us */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-800 overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Contact Us</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  If you have questions about this Return Policy or need to request a refund, please contact us:
                </p>
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-6 text-lg">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
