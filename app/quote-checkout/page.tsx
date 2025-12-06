"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { CreditCard, X, ChevronDown, ChevronUp, ArrowLeft, Shield, Lock, Building2, Loader2, Info } from "lucide-react"
import { useAuth } from "@/context/auth"
import { useSettings } from "@/context/settings"
import { useNotifications } from "@/hooks/use-notifications"
import { useQuoteExpiration } from "@/hooks/use-quote-expiration"
import { useRouter } from "next/navigation"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js"
import dynamic from "next/dynamic"

interface QuoteData {
  id?: string
  policyNumber?: string
  total: number
  startTime: string
  expiryTime: string
  breakdown: {
    duration: string
    reason: string
  }
  customerData: {
    firstName: string
    middleName: string
    lastName: string
    dateOfBirth: string
    phoneNumber: string
    occupation: string
    address: string
    licenseType: string
    licenseHeld: string
    vehicleValue: string
    reason: string
    duration: string
    registration: string
    vehicle: {
      make: string
      model: string
      year: string
      engineCC: string
    }
  }
}

const StripePayment = forwardRef<{ handlePayment: () => Promise<void> }, {
  quoteData: QuoteData | null
  user: any
  quote: any
  onProcessingChange: (val: boolean) => void
  formData: any
}>(({ quoteData, user, quote, onProcessingChange, formData }, ref) => {
  const stripe = useStripe()
  const elements = useElements()
  const { addNotification } = useNotifications()

  useImperativeHandle(ref, () => ({
    async handlePayment() {
      if (!stripe || !elements) {
        addNotification({
          type: "error",
          title: "Payment Error",
          message: "Stripe is not ready. Please try again.",
        })
        return
      }

      try {
        onProcessingChange(true)

        // Get the CardNumberElement
        const cardNumberElement = elements.getElement(CardNumberElement)
        if (!cardNumberElement) {
          throw new Error("Card number element not found")
        }

        // Create a payment method
        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: "card",
          card: cardNumberElement,
        })

        if (error) {
          throw new Error(error.message || "Failed to create payment method")
        }

        // Call the backend to create the payment
        const response = await fetch("/api/quote-checkout/create-stripe-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
            user: user,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Payment failed")
        }

        addNotification({
          type: "success",
          title: "Payment Successful",
          message: "Your payment has been processed.",
        })

        // Redirect to confirmation
        window.location.href = "/payment-confirmation"
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Payment Error",
          message: error.message || "An error occurred during payment",
        })
        onProcessingChange(false)
      }
    },
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="cardNumber" className="text-sm font-medium text-white">
          Card Number
        </label>
        <div className="relative">
          <CardNumberElement
            id="cardNumber"
            className="h-11 pr-14 p-3 border border-cyan-500/20 rounded-lg bg-gray-800/50 text-white"
            options={{ style: { base: { fontSize: "16px", color: "#ffffff" } } }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="expiry" className="text-sm font-medium text-white">
            Expiry Date
          </label>
          <CardExpiryElement
            id="expiry"
            className="h-11 p-3 border border-cyan-500/20 rounded-lg bg-gray-800/50 text-white"
            options={{ style: { base: { fontSize: "16px", color: "#ffffff" } } }}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cvv" className="text-sm font-medium text-white">
            CVV
          </label>
          <CardCvcElement
            id="cvv"
            className="h-11 p-3 border border-cyan-500/20 rounded-lg bg-gray-800/50 text-white"
            options={{ style: { base: { fontSize: "16px", color: "#ffffff" } } }}
          />
        </div>
      </div>
    </div>
  )
})
StripePayment.displayName = "StripePayment"

export function CoveriseCheckoutPage() {
  const { isAuthenticated, user: authUser, login } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const settings = useSettings()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [quote, setQuote] = useState<any>({})
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [showQuoteSummary, setShowQuoteSummary] = useState(false)
  const [paymentView, setPaymentView] = useState<"selection" | "card-details" | "bank-details">("selection")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [checkboxContent, setCheckboxContent] = useState<string[]>([])
  const [checkboxStates, setCheckboxStates] = useState<boolean[]>([])
  const [airwallexElement, setAirwallexElement] = useState<any>(null)

  const airwallexCardRef = useRef(null)
  const stripePaymentRef = useRef<{ handlePayment: () => Promise<void>; handleSquarePayment: () => Promise<void> }>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    termsAccepted: false,
    accuracyConfirmed: false,
    cardNumber: "",
    nameOnCard: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    billingAddress1: "",
    billingAddress2: "",
    billingCity: "",
    billingPostcode: "",
    billingCountry: "United Kingdom",
  })

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Load quote data from localStorage on component mount
  useEffect(() => {
    const storedQuoteData = localStorage.getItem("quoteData")
    if (storedQuoteData) {
      try {
        const parsed = JSON.parse(storedQuoteData)
        // Check if quoteData is nested (from API response) or direct
        const actualQuoteData = parsed.quoteData ? JSON.parse(parsed.quoteData) : parsed
        setQuoteData(actualQuoteData)
        // Also set the quote object for payment processing
        setQuote(parsed)
      } catch (error) {
        console.error("Error parsing quote data:", error)
        router.push("/get-quote")
      }
    } else {
      // Redirect back to quote page if no data found
      router.push("/get-quote")
    }
    
    // Load checkbox content from settings
    if (settings?.general) {
      let content = settings.general.checkoutCheckboxContent ? settings.general.checkoutCheckboxContent.split('||').map((item: string) => item.trim()) : []
      if (content.length === 0 || (content.length === 1 && content[0] === '')) {
        content = [
          'I confirm I\'ve read and agree to the <a href="/terms-of-services" target="_blank" class="font-medium text-cyan-400 hover:underline">Terms of Service</a> and understand this is a non-refundable digital document service. *',
          'I acknowledge that all purchases are final and the information I have entered is accurate *'
        ]
      }
      setCheckboxContent(content)
      setCheckboxStates(Array(content.length).fill(false))
    }
  }, [router, settings])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCompletePayment = async () => {
    if (!checkboxStates.every(c => c)) {
      addNotification({
        type: "error",
        title: "Missing Information",
        message: "Please accept all the terms and conditions.",
      })
      return
    }
    
    setIsProcessingPayment(true)

    switch (selectedPaymentMethod) {
      case "mollie":
        try {
          const response = await fetch("/api/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
              user: authUser,
            }),
          })
          const data = await response.json()
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl
          } else {
            throw new Error(data.error || "Could not initiate payment.")
          }
        } catch (error: any) {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: error.message,
          })
          setIsProcessingPayment(false)
        }
        break

      case "stripe":
        if (stripePaymentRef.current) {
          await stripePaymentRef.current.handlePayment()
        } else {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: "Stripe component not ready.",
          })
          setIsProcessingPayment(false)
        }
        break

      case "airwallex":
        if (!airwallexElement) {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: "Airwallex is not ready.",
          })
          setIsProcessingPayment(false)
          return
        }
        try {
          const Airwallex = (await import("airwallex-payment-elements")).default
          await Airwallex.confirmPaymentIntent({
            element: airwallexElement,
            id: airwallexElement.intent.id,
            client_secret: airwallexElement.intent.client_secret,
          })
          addNotification({
            type: "success",
            title: "Payment Processing",
            message: "Your payment is processing. You will receive an email confirmation shortly.",
          })
        } catch (error: any) {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: error.message,
          })
          setIsProcessingPayment(false)
        }
        break

      case "bank":
        try {
          const response = await fetch("/api/quote-checkout/update-payment-method", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              policyNumber: quoteData?.policyNumber,
              paymentMethod: "bank_transfer",
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to update payment method")
          }

          localStorage.removeItem("quoteCreationTimestamp")
          router.push(`/bank-payment-details?policynumber=${quoteData?.policyNumber}`)
        } catch (error) {
          console.error("Error updating payment method:", error)
          addNotification({
            type: "error",
            title: "Error",
            message: "There was an error updating the payment method. Please try again.",
          })
        } finally {
          setIsProcessingPayment(false)
        }
        break

      case "square":
        if (stripePaymentRef.current) {
          await stripePaymentRef.current.handleSquarePayment()
        } else {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: "Square payment component not ready.",
          })
          setIsProcessingPayment(false)
        }
        break

      case "paddle":
        try {
          const response = await fetch("/api/paddle/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
              user: authUser,
            }),
          })
          const data = await response.json()
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl
          } else {
            throw new Error(data.error || "Could not initiate Paddle payment.")
          }
        } catch (error: any) {
          addNotification({
            type: "error",
            title: "Payment Error",
            message: error.message,
          })
          setIsProcessingPayment(false)
        }
        break

      default:
        addNotification({
          type: "error",
          title: "Invalid Payment Method",
          message: "Please select a valid payment method.",
        })
        setIsProcessingPayment(false)
    }
  }


  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")
    return formatted.slice(0, 19)
  }
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    handleInputChange("cardNumber", formatted)
  }
  // Generate array of months (01-12)
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return month < 10 ? `0${month}` : `${month}`
  })
  // Generate array of years (current year + 10 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => `${currentYear + i}`)

  const paymentProvider = settings?.paymentProvider?.activeProcessor || settings?.payment?.activeProcessor
  const bankPaymentEnabled = settings?.bank?.show
  
  const paymentMethods = []
  if (paymentProvider) {
    paymentMethods.push({
      id: paymentProvider,
      title: "Credit or Debit Card",
      description: "Visa, Mastercard, Amex accepted",
      icon: <CreditCard className="w-5 h-5 text-cyan-400" />,
      type: "card",
    })
  }
  if (bankPaymentEnabled) {
    paymentMethods.push({
      id: "bank",
      title: "Bank Transfer",
      description: "Secure direct payment from your bank",
      icon: <Building2 className="w-5 h-5 text-cyan-400" />,
      type: "bank",
    })
  }

  // Get expiration dialog
  const { ExpirationDialog } = useQuoteExpiration(quote, selectedPaymentMethod || undefined)

  // Show loading if quote data hasn't loaded yet
  if (!quoteData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <ExpirationDialog />
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse mx-auto mb-4"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <main className="relative px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
              Checkout
            </h1>
            <p className="text-gray-400">Complete your order securely</p>
          </div>

          {/* Mobile Quote Summary Toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowQuoteSummary(!showQuoteSummary)}
              className="w-full bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-cyan-500/20 flex justify-between items-center"
            >
              <div className="text-left">
                <div className="font-medium text-white">Order Summary</div>
                <div className="text-sm text-gray-400">Total: £{quoteData ? quoteData.total.toFixed(2) : "0.00"}</div>
              </div>
              {showQuoteSummary ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showQuoteSummary && (
              <div className="mt-4 bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-cyan-500/20">
                <h3 className="font-bold text-white mb-4">DETAILS</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Registration:</span>
                    <span className="font-medium text-cyan-400">{quoteData.customerData.registration}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="font-medium text-white">
                      {quoteData.customerData.vehicle.make} {quoteData.customerData.vehicle.model}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Start Time:</span>
                    <span className="font-medium text-white">{quoteData.startTime}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">End Time:</span>
                    <span className="font-medium text-white">{quoteData.expiryTime}</span>
                  </div>
                </div>
                <div className="border-t border-gray-700 mt-4 pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-cyan-400">£{quoteData ? quoteData.total.toFixed(2) : "0.00"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Checkout Form */}
            <div className="space-y-6 lg:space-y-8">
              {/* Information Section */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/20">
                <h2 className="text-lg font-bold text-white mb-4">INFORMATION</h2>
                <div className="space-y-4">
                  {isAuthenticated && authUser ? (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">
                        You are currently logged in as:{" "}
                        <span className="font-medium text-cyan-400">
                          {authUser.firstName} {authUser.lastName} ({authUser.email})
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        Already have an account with us?{" "}
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          Login
                        </button>
                      </p>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Email Address"
                        className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  )}
                  {!isAuthenticated && (
                    <p className="text-sm text-gray-400">If you do not have an account, we will create one for you</p>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/20">
                <h2 className="text-lg font-bold text-white mb-4">PAYMENT</h2>
                <p className="text-sm text-gray-400 mb-4">All transactions are secure and encrypted.</p>

                {/* Amount */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-white">Amount:</span>
                    <span className="text-xl font-bold text-cyan-400">£{quoteData ? quoteData.total.toFixed(2) : "0.00"}</span>
                  </div>
                </div>

                {/* Payment Method - Selection View */}
                {paymentView === "selection" && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-white mb-3">Payment Method</h3>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedPaymentMethod(method.id)
                            setPaymentView(method.type === "card" ? "card-details" : "bank-details")
                          }}
                          className="w-full bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 sm:p-6 hover:bg-gray-800 hover:border-cyan-500/40 transition-all text-left flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            {method.icon}
                            <div>
                              <div className="font-medium text-white">{method.title}</div>
                              <div className="text-sm text-gray-400">{method.description}</div>
                            </div>
                          </div>
                          <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Method - Card Details View */}
                {paymentView === "card-details" && (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/20 flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="font-medium text-white">Credit or Debit Card</div>
                        <div className="text-sm text-gray-400">
                          {selectedPaymentMethod === "stripe" && "Enter your card details below (Powered by Stripe)"}
                          {selectedPaymentMethod === "square" && "Enter your card details below (Powered by Square)"}
                          {selectedPaymentMethod === "airwallex" && "Enter your card details below (Powered by Airwallex)"}
                          {selectedPaymentMethod === "mollie" && "You will be redirected to Mollie"}
                          {selectedPaymentMethod === "paddle" && "You will be redirected to Paddle"}
                        </div>
                      </div>
                    </div>

                    {/* Stripe Payment Form */}
                    {selectedPaymentMethod === "stripe" && (
                      <div className="rounded-lg border border-cyan-500/20 bg-gray-900/50 p-6 space-y-4">
                        <p className="text-sm text-gray-400 mb-4">Enter your payment details securely:</p>
                        <StripePayment
                          ref={stripePaymentRef}
                          quoteData={quoteData}
                          user={authUser}
                          quote={quote}
                          onProcessingChange={setIsProcessingPayment}
                          formData={formData}
                        />
                      </div>
                    )}

                    {/* Square Payment Form */}
                    {selectedPaymentMethod === "square" && (
                      <div className="rounded-lg border border-cyan-500/20 bg-gray-900/50 p-6 space-y-4">
                        <p className="text-sm text-gray-400 mb-4">Enter your payment details securely:</p>
                        <div className="bg-gray-800/50 rounded p-4 border border-gray-700">
                          <p className="text-sm text-gray-300 text-center">
                            Square payment form will appear here when the page is properly initialized
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Airwallex Payment Form */}
                    {selectedPaymentMethod === "airwallex" && (
                      <div className="rounded-lg border border-cyan-500/20 bg-gray-900/50 p-6 space-y-4">
                        <p className="text-sm text-gray-400 mb-4">Enter your payment details securely:</p>
                        <div ref={airwallexCardRef} className="bg-gray-800/50 rounded p-4 border border-gray-700 min-h-20">
                          <p className="text-sm text-gray-300 text-center">Airwallex card element loading...</p>
                        </div>
                      </div>
                    )}

                    {/* Redirect Payment Methods */}
                    {(selectedPaymentMethod === "mollie" || selectedPaymentMethod === "paddle") && (
                      <div className="rounded-lg border border-cyan-500/20 bg-gray-900/50 p-4">
                        <p className="text-sm text-gray-300 text-center">
                          {selectedPaymentMethod === "mollie"
                            ? "Click the button below to proceed to Mollie's secure payment page"
                            : "Click the button below to proceed to Paddle's secure payment page"}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleCompletePayment}
                      disabled={!checkboxStates.every(c => c) || isProcessingPayment}
                      className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-4 text-lg font-semibold h-14 disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Pay £{quoteData ? quoteData.total.toFixed(2) : "0.00"}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setPaymentView("selection")}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Payment Methods
                    </Button>
                  </div>
                )}

                {/* Payment Method - Bank Details View */}
                {paymentView === "bank-details" && (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/20 flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="font-medium text-white">Bank Transfer</div>
                        <div className="text-sm text-gray-400">Direct payment from your bank</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-gray-900/50 p-4">
                      <p className="text-sm text-gray-300 text-center">
                        Once you confirm your order, we&apos;ll provide complete bank transfer instructions including all
                        account details needed to complete your payment securely.
                      </p>
                    </div>

                    <Button
                      onClick={handleCompletePayment}
                      disabled={!checkboxStates.every(c => c) || isProcessingPayment}
                      className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-4 text-lg font-semibold h-14 disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Pay £{quoteData ? quoteData.total.toFixed(2) : "0.00"}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setPaymentView("selection")}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Payment Methods
                    </Button>
                  </div>
                )}

                {/* Billing Address */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-white">Billing Address</h3>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same-address"
                      checked={useSameAddress}
                      onCheckedChange={(checked) => setUseSameAddress(checked as boolean)}
                    />
                    <label htmlFor="same-address" className="text-sm text-gray-300">
                      Use same as personal address
                    </label>
                  </div>

                  {!useSameAddress && (
                    <div className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          value={formData.billingAddress1}
                          onChange={(e) => handleInputChange("billingAddress1", e.target.value)}
                          className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          placeholder="Address Line 1"
                          required
                        />
                      </div>

                      <div>
                        <Input
                          type="text"
                          value={formData.billingAddress2}
                          onChange={(e) => handleInputChange("billingAddress2", e.target.value)}
                          className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          placeholder="Address Line 2 (Optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          value={formData.billingCity}
                          onChange={(e) => handleInputChange("billingCity", e.target.value)}
                          className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          placeholder="City"
                          required
                        />

                        <Input
                          type="text"
                          value={formData.billingPostcode}
                          onChange={(e) => handleInputChange("billingPostcode", e.target.value)}
                          className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          placeholder="Postcode"
                          required
                        />
                      </div>

                      <div>
                        <Select
                          value={formData.billingCountry}
                          onValueChange={(value) => handleInputChange("billingCountry", value)}
                        >
                          <SelectTrigger className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="Spain">Spain</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Important Notice */}
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-200">
                    <strong>Important Notice:</strong> Please avoid using an <strong>@outlook.com</strong> or
                    <strong>@icloud.com</strong> email address for your order. We are currently experiencing issues with
                    sending emails to these domains. Thank you for your understanding.
                  </p>
                </div>
              </div>

              {/* Create Account Password */}
              {!isAuthenticated && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/20">
                  <h2 className="text-lg font-bold text-white mb-4">CREATE AN ACCOUNT PASSWORD</h2>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Password"
                      className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                    <p className="text-sm text-gray-400">
                      Your personal data will be used to process your order, support your experience throughout this
                      website, and for other purposes described in our
                      <Link href="/coverise/privacy-policy" className="text-cyan-400 hover:text-cyan-300">
                        privacy policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/20">
                <div className="space-y-4">
                  {checkboxContent.map((content, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Checkbox
                        id={`checkbox-${index}`}
                        checked={checkboxStates[index] || false}
                        onCheckedChange={(checked) => {
                          const newStates = [...checkboxStates]
                          newStates[index] = checked as boolean
                          setCheckboxStates(newStates)
                        }}
                        className="mt-1"
                      />
                      <label htmlFor={`checkbox-${index}`} className="text-sm text-gray-300 leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Payment Button */}
              <Button
                onClick={handleCompletePayment}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white py-4 text-lg font-semibold h-14"
                disabled={!checkboxStates.every(c => c)}
              >
                Complete Payment
              </Button>
            </div>

            {/* Right Column - Quote Summary (Desktop Only) */}
            <div className="hidden lg:block">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/20 sticky top-6">
                <h2 className="text-lg font-bold text-white mb-6">DETAILS</h2>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Registration Number:</span>
                    <span className="font-medium text-cyan-400">{quoteData.customerData.registration}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Vehicle Make:</span>
                    <span className="font-medium text-white">{quoteData.customerData.vehicle.make}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Vehicle Model:</span>
                    <span className="font-medium text-white">{quoteData.customerData.vehicle.model}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Start Time:</span>
                    <span className="font-medium text-white">{quoteData.startTime}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">End Time:</span>
                    <span className="font-medium text-white">{quoteData.expiryTime}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Date of Birth:</span>
                    <span className="font-medium text-white">{quoteData.customerData.dateOfBirth}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Name(s):</span>
                    <span className="font-medium text-white">
                      {quoteData.customerData.firstName} {quoteData.customerData.lastName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-400">Address:</span>
                    <span className="font-medium text-white">{quoteData.customerData.address}</span>
                  </div>
                </div>

                <div className="border-t border-gray-700 mt-6 pt-4">
                  <div className="flex justify-between items-center mb-2 text-white">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">£{quoteData ? quoteData.total.toFixed(2) : "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-cyan-400">£{quoteData ? quoteData.total.toFixed(2) : "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">WELCOME BACK</h2>
                <button onClick={() => setLoginModalOpen(false)} className="text-gray-400 hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-6">Please enter your login details below.</p>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()

                  // Simulate login process
                  if (loginData.email && loginData.password) {
                    addNotification({
                      type: "info",
                      title: "Logging in",
                      message: "Please wait...",
                    })

                    // Simulate API call
                    setTimeout(() => {
                      // For demo purposes, accept any email/password
                      login() // This calls the login function from useAuth
                      addNotification({
                        type: "success",
                        title: "Login Successful",
                        message: "Welcome back!",
                      })
                      setLoginModalOpen(false)

                      // Reset form
                      setLoginData({
                        email: "",
                        password: "",
                        rememberMe: false,
                      })
                    }, 1000)
                  } else {
                    addNotification({
                      type: "error",
                      title: "Missing Information",
                      message: "Please enter both email and password",
                    })
                  }
                }}
              >
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                    value={loginData.email}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    className="w-full h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) =>
                        setLoginData((prev) => ({ ...prev, rememberMe: checked as boolean }))
                      }
                    />
                    <label htmlFor="remember-me" className="text-sm text-gray-300">
                      Remember Me
                    </label>
                  </div>

                  <button type="button" className="text-sm text-cyan-400 hover:text-cyan-300 text-left sm:text-right">
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white h-12 text-base"
                >
                  Login
                </Button>

                <Button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  variant="outline"
                  className="w-full h-12 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DynamicCheckoutPage = dynamic(() => Promise.resolve(CoveriseCheckoutPage), { ssr: false })

export default function CoveriseCheckoutPageWrapper() {
  const settings = useSettings()
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  const paymentProvider = settings?.paymentProvider?.activeProcessor || settings?.payment?.activeProcessor

  useEffect(() => {
    if (paymentProvider === "stripe" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY))
    }
  }, [paymentProvider, settings])

  if (!settings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const page = <DynamicCheckoutPage />

  if (paymentProvider === "stripe" && stripePromise) {
    return <Elements stripe={stripePromise}>{page}</Elements>
  }

  return page
}
