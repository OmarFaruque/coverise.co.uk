export default function Loader2() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="mt-4 text-cyan-400">Loading...</p>
      </div>
    </div>
  )
}