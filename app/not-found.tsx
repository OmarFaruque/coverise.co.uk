import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Frown } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-48 top-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-48 top-2/3 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="text-center max-w-lg mx-auto p-6 relative z-10">
        <div className="mb-8">
          <div className="text-9xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Frown className="w-10 h-10 text-cyan-400" />
            Page Not Found
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you may have typed the URL incorrectly.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-5 w-5" />
              Go to Homepage
            </Link>
          </Button>

          <Button variant="outline" asChild size="lg" className="w-full bg-transparent border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
            <Link href="/" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </Link>
          </Button>
        </div>

        <div className="mt-10 pt-6 border-t border-cyan-900/30">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-cyan-400 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}