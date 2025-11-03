import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Fuel, BarChart3, Lock, Receipt } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg">
              <Fuel className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Track Your Fuel Consumption with Ease
          </h1>

          <p className="text-pretty text-lg text-slate-600 sm:text-xl">
            Monitor your vehicle's fuel efficiency, manage expenses in South African Rand, and keep records for SARS tax
            purposes.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Everything you need to manage your fuel logs
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100">
                <BarChart3 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Track Efficiency</h3>
              <p className="text-sm text-slate-600">
                Automatically calculate km/L and monitor your vehicle's fuel consumption over time
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100">
                <Receipt className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Receipt Storage</h3>
              <p className="text-sm text-slate-600">
                Upload and store receipt images for every fuel purchase with automatic conversion
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-100">
                <Lock className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">SARS Compliant</h3>
              <p className="text-sm text-slate-600">
                Separate work travel from personal use for accurate tax reporting
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-100">
                <Fuel className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Multi-Vehicle</h3>
              <p className="text-sm text-slate-600">Manage multiple vehicles with detailed records for each car</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-600">
          <p>&copy; 2025 Fuel Logbook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
