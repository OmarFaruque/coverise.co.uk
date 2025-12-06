"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationContainer } from "@/components/notification"
// import { getPolicyByNumber } from "@/lib/policy-data" // Original page.tsx uses API, new-page.tsx uses this local func
import { FileText, Car, MessageSquare, ArrowLeft, Shield, Download, AlertCircle } from "lucide-react"
import { useSettings } from "@/context/settings" // From original page.tsx

// Keep the PrintableCertificate component as it exists in the original page.tsx
// It's used for actual printing functionality, not direct display or download logic
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const PrintableCertificate = ({ policyData, formatDateTime, settings }) => {
  const [logoUrl, setLogoUrl] = useState(process.env.NEXT_PUBLIC_BASE_URL + "/cert-logo.png")

  useEffect(() => {
    setLogoUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/cert-logo.png`)
  }, [])
  
  if (!policyData) return null
  const template = settings?.certificateTemplate

  const quoteData = policyData.quoteData ? JSON.parse(policyData.quoteData) : {}
  const customerData = quoteData.customerData || {}

  const docNumber = policyData.policyNumber
  const registrationMark = policyData.regNumber
  const descriptionOfVehicles = `${policyData.vehicleMake} ${policyData.vehicleModel}`
  const make = policyData.vehicleMake
  const model = policyData.vehicleModel
  const name = `${policyData.nameTitle} ${policyData.firstName} ${policyData.lastName}`
  const dob = new Date(policyData.dateOfBirth).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const license = customerData.licenseType || "Full"
  const effectiveDate = formatDateTime(policyData.startDate)
  const expiryDate = formatDateTime(policyData.endDate)
  const address = policyData.postCode ? `${policyData.address}, ${policyData.postCode}` : policyData.address

  const premium = Number(policyData.update_price ?? policyData.cpw).toFixed(2)
  const excess = "750.00"

  const templateData = {
    docNumber,
    registrationMark,
    descriptionOfVehicles,
    make,
    model,
    name: name.toUpperCase(),
    dob,
    license,
    effectiveDate,
    expiryDate,
    address,
    premium,
    excess,
  }

  const replaceVariables = (text: string) => {
    if (!text) return ""
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return templateData[variable as keyof typeof templateData] || match
    })
  }

  const page1Content = template ? replaceVariables(template.page1) : "Template not loaded."
  const page2Content = template ? replaceVariables(template.page2) : "Template not loaded."
  const page1FooterContent = template ? replaceVariables(template.page1_footer) : ""

  return (
    <div id="printable-certificate" className="printable-certificate hidden print:block">
      {/* Page 1 */}
      <div id="certificate-page-1" className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none">
        <div className="flex flex-col items-center justify-center pt-1 -mb-2">
          <img
            src={logoUrl}
            alt="Motor Covernote Limited"
            width={128}
            height={38}
            className="h-auto w-[128px]"
            crossOrigin="anonymous"
          />
        </div>

        <div className="px-2 pb-2" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}>
          <div className="border-2 rounded border-gray-900 p-2 relative overflow-hidden" style={{ minHeight: "420px" }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.08 }}>
              {Array.from({ length: 120 }).map((_, i) => {
                const cols = 10
                const rows = 12
                const col = i % cols
                const row = Math.floor(i / cols)

                return (
                  <div
                    key={i}
                    className="absolute font-bold whitespace-nowrap"
                    style={{
                      transform: "rotate(-45deg)",
                      left: `${col * 20 - 10}%`,
                      top: `${row * 15 - 5}%`,
                      fontSize: "12px",
                      color: "#666666",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {name.toUpperCase()} {docNumber}
                  </div>
                )
              })}
            </div>

            <div className="relative z-10" dangerouslySetInnerHTML={{ __html: page1Content }} />
          </div>

          <div className="mt-2" dangerouslySetInnerHTML={{ __html: page1FooterContent }} />
        </div>
      </div>

      {/* Page 2 */}
      <div
        id="certificate-page-2"
        className="rounded-lg bg-white shadow-2xl overflow-hidden print:shadow-none print:border-none print:mt-0"
      >
        <div className="p-8" style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }} dangerouslySetInnerHTML={{ __html: page2Content }}></div>
      </div>
    </div>
  )
}

export default function CoveriseOrderDetailsPage() { // Renamed from PolicyDetailsPage
  const searchParams = useSearchParams()
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const orderNumber = searchParams.get("number") // Renamed from policyNumber
  const settings = useSettings() // From original page.tsx

  const [isVerified, setIsVerified] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null) // Renamed from policyData
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is verified and load order data
  useEffect(() => {
    if (!orderNumber) {
      router.push("/coverise")
      return
    }

    const verified = sessionStorage.getItem(`policy_verified_${orderNumber}`)
    if (verified !== "true") {
      router.push(`/order/view?number=${orderNumber}`) // Adjusted path
      return
    }

    setIsVerified(true)

    // Load order data (from original page.tsx - API call)
    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/policy/details?number=${orderNumber}`)
        if (!response.ok) {
          throw new Error("Order not found") // Adjusted message
        }
        const data = await response.json()

        const now = new Date()
        let status = "Active"
        if (now < new Date(data.startDate)) {
          status = "Pending"
        } else if (now > new Date(data.endDate)) {
          status = "Expired"
        }

        const mappedData = {
          ...data,
          vehicleReg: data.regNumber,
          customerFirstName: data.firstName,
          customerSurname: data.lastName,
          premium: Number(data.update_price ?? data.cpw).toFixed(2),
          status: status,
        }
        setOrderData(mappedData) // Use setOrderData
      } catch (error) {
        console.error("Failed to fetch order data:", error) // Adjusted message
        addNotification({
          type: "error",
          title: "Order Not Found",
          message: "The requested order could not be found.",
        })
        router.push("/coverise") // Adjusted path
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [orderNumber, router, addNotification])

  // formatDateTime from original page.tsx
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // PDF generation functions (keeping original page.tsx functionality - API calls)
  const handleDownloadDocument = () => {
    setIsDownloading(true);
    window.open(`/api/generate-certificate?number=${orderNumber}`, "_blank");
    setTimeout(() => setIsDownloading(false), 2000); // Simulate loading
    addNotification({
      type: "success",
      title: "Document Opened",
      message: "Your certificate has been opened in a new tab.",
    });
  };

  const handleDownloadSchedule = () => {
    setIsDownloading(true);
    window.open(`/api/generate-policy-schedule?number=${orderNumber}`, "_blank");
    setTimeout(() => setIsDownloading(false), 2000); // Simulate loading
    addNotification({
      type: "success",
      title: "Document Opened",
      message: "Your schedule has been opened in a new tab.",
    });
  };

  const handleDownloadStatement = () => {
    setIsDownloading(true);
    window.open(`/api/generate-statement-of-fact?number=${orderNumber}`, "_blank");
    setTimeout(() => setIsDownloading(false), 2000); // Simulate loading
    addNotification({
      type: "success",
      title: "Document Opened",
      message: "Your statement has been opened in a new tab.",
    });
  };

  if (isLoading || !isVerified) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <main className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <main className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
            <p className="text-gray-400 mb-6">The requested order could not be found.</p>
            <Button
              onClick={() => router.push("/coverise")}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
            >
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      <main className="px-3 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/coverise/dashboard")}
              className="mb-4 text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 shadow-2xl border-2 border-cyan-500/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 rounded-full blur-2xl -ml-24 -mb-24" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                      Order Details
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">View and download your document information</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${orderData.status === "Active"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : orderData.status === "Expired"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                          : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"}`}
                  >
                    {orderData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mr-3">
                    <Car className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{orderData.vehicleReg}</h3>
                    <p className="text-lg text-gray-400 font-medium">
                      {orderData.vehicleMake} {orderData.vehicleModel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Document Number</span>
                  <span className="text-base font-bold text-white">{orderData.policyNumber}</span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Premium</span>
                  <span className="text-base font-bold text-white">£{orderData.premium}</span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Valid From</span>
                  <span className="text-base font-bold text-white">
                    {formatDateTime(orderData.startDate)}
                  </span>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                  <span className="text-sm text-gray-400 font-medium block mb-1">Valid Until</span>
                  <span className="text-base font-bold text-white">
                    {formatDateTime(orderData.endDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Documents</h2>
                    <p className="text-sm text-gray-400 font-medium">Download your documents securely</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-white">Certificate</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownloadDocument}
                      disabled={isDownloading}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Opening..." : "Download"}
                    </Button>
                  </div>
                </div>

                {settings?.general?.policyScheduleVisible && orderData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-white">Schedule</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownloadSchedule}
                        disabled={isDownloading}
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? "Opening..." : "Download"}
                      </Button>
                    </div>
                  </div>
                )}

                {settings?.general?.statementOfFactVisible && orderData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-white">Statement of Fact</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownloadStatement}
                        disabled={isDownloading}
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? "Opening..." : "Download"}
                      </Button>
                    </div>
                  </div>
                )}

                {settings?.general?.productInformationVisible && orderData.status !== "Expired" && (
                  <div className="group bg-gradient-to-r from-cyan-500/10 to-black/30 p-4 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-white">Product Information</p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/.pdf/tempnow.pdf`, "_blank")
                        }
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? "Opening..." : "Download"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-white mb-2">Need Help?</h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-3">
                      If you require any assistance or experience any issues, please contact us through our contact
                      page.
                    </p>
                    <Button
                      onClick={() => router.push("/coverise/contact")}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-4 py-2 h-auto text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </div>
  )
}