import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Plus, Fuel, TrendingUp, DollarSign, Calendar, Receipt } from "lucide-react"
import type { FuelLog } from "@/lib/types"
import { ExportLogsButton } from "@/components/export-logs-button"

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch car details
  const { data: car } = await supabase.from("cars").select("*").eq("id", id).eq("user_id", user.id).single()

  if (!car) {
    redirect("/dashboard/cars")
  }

  // Fetch fuel logs for this car
  const { data: fuelLogs } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("car_id", id)
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  // Calculate statistics
  const totalLiters = fuelLogs?.reduce((sum, log) => sum + Number(log.liters), 0) || 0
  const totalCost = fuelLogs?.reduce((sum, log) => sum + Number(log.total_cost), 0) || 0
  const avgKmPerLiter =
    fuelLogs && fuelLogs.length > 0
      ? fuelLogs.reduce((sum, log) => sum + (Number(log.km_per_liter) || 0), 0) /
        fuelLogs.filter((log) => log.km_per_liter).length
      : 0
  const workDistance = fuelLogs?.reduce((sum, log) => sum + Number(log.work_distance || 0), 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/cars">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Link>
        </Button>
      </div>

      {/* Car Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {car.make} {car.model}
        </h1>
        <p className="text-slate-600">
          {car.year} • {car.registration_number}
        </p>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Fuel</CardTitle>
            <Fuel className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLiters.toFixed(2)} L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgKmPerLiter.toFixed(2)} km/L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Work Travel</CardTitle>
            <Calendar className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workDistance.toFixed(0)} km</div>
            <p className="text-xs text-slate-600">For SARS</p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Logs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Fuel Logs</h2>
          <div className="flex gap-2">
            <ExportLogsButton carId={id} buttonText="Email Report" />
            <Button asChild>
              <Link href={`/dashboard/cars/${id}/logs/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Log
              </Link>
            </Button>
          </div>
        </div>

        {fuelLogs && fuelLogs.length > 0 ? (
          <div className="space-y-4">
            {fuelLogs.map((log: FuelLog) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(log.date).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription>{log.petrol_station || "No station specified"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {log.is_work_travel && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Work Travel
                        </Badge>
                      )}
                      {log.is_locked && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Locked
                        </Badge>
                      )}
                      {log.receipt_url && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Receipt className="mr-1 h-3 w-3" />
                          Receipt
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-slate-600">Odometer</p>
                      <p className="text-lg font-semibold">{Number(log.odometer_reading).toFixed(0)} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Liters</p>
                      <p className="text-lg font-semibold">{Number(log.liters).toFixed(2)} L</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Price/Liter</p>
                      <p className="text-lg font-semibold">R {Number(log.price_per_liter).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Cost</p>
                      <p className="text-lg font-semibold">R {Number(log.total_cost).toFixed(2)}</p>
                    </div>
                  </div>

                  {log.km_per_liter && (
                    <div className="mt-4 rounded-lg bg-emerald-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-800">Fuel Efficiency</p>
                          <p className="text-xl font-bold text-emerald-900">
                            {Number(log.km_per_liter).toFixed(2)} km/L
                          </p>
                        </div>
                        {log.distance_traveled && (
                          <div className="text-right">
                            <p className="text-sm text-emerald-800">Distance Traveled</p>
                            <p className="text-xl font-bold text-emerald-900">
                              {Number(log.distance_traveled).toFixed(0)} km
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {log.is_work_travel && log.work_distance && (
                    <div className="mt-2 rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-800">Work Distance (SARS)</p>
                      <p className="text-lg font-semibold text-blue-900">{Number(log.work_distance).toFixed(0)} km</p>
                    </div>
                  )}

                  {log.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-600">Notes</p>
                      <p className="text-sm text-slate-900">{log.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="bg-transparent">
                      <Link href={`/dashboard/cars/${id}/logs/${log.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Fuel className="mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No fuel logs yet</h3>
              <p className="mb-4 text-center text-sm text-slate-600">
                Add your first fuel log to start tracking consumption
              </p>
              <Button asChild>
                <Link href={`/dashboard/cars/${id}/logs/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fuel Log
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
