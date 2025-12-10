import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Home, MessageSquare } from "lucide-react"
import Link from "next/link"

export default async function TicketLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-md sticky top-0 z-50 border-b border-cyan-900/30">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
            COVERISE
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Support Request
            </Button>
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-400">
            <Skeleton className="h-4 w-12" />
            <span className="mx-2">/</span>
            <Skeleton className="h-4 w-16" />
            <span className="mx-2">/</span>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Back Button */}
          <div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Ticket Header */}
          <Card className="bg-gray-900/50 border border-cyan-500/30">
            <CardHeader className="bg-gray-800/80 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2 bg-white/10" />
                    <Skeleton className="h-5 w-64 bg-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16 bg-white/10" />
                  <Skeleton className="h-6 w-20 bg-white/10" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-5 w-28 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="bg-gray-900/50 border border-cyan-500/30">
            <CardHeader className="border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-cyan-500/20 rounded" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Message skeletons */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] space-y-3 bg-gray-800/50 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-700/50 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-3 bg-cyan-500/10 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan-500/30 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[85%] space-y-3 bg-gray-800/50 rounded-2xl p-4">
                     <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-700/50 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>

              {/* Reply Form Skeleton */}
              <div className="space-y-6 border-t border-gray-800 pt-8 mt-8">
                <div>
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
