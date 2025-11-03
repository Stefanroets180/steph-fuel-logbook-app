import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Car, Plus, Fuel, TrendingUp, DollarSign, Calendar } from "lucide-react"
import type { Car as CarType } from "@/lib/types"
import { FuelEfficiencyChart } from "@/components/fuel-efficiency-chart"
import { ExportLogsButton } from "@/components/export-logs-button"

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Fetch user's cars
    const { data: cars } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Fetch all fuel logs
    const { data: allLogs } = await supabase
        .from("fuel_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

    // Fetch recent fuel logs with car details
    const { data: recentLogs } = await supabase
        .from("fuel_logs")
        .select("*, car:cars(*)")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5)

    // Calculate overall statistics
    const totalFuelLogs = allLogs?.length || 0
    const totalLiters = allLogs?.reduce((sum, log) => sum + Number(log.liters), 0) || 0
    const totalCost = allLogs?.reduce((sum, log) => sum + Number(log.total_cost), 0) || 0
    const logsWithEfficiency = allLogs?.filter((log) => log.km_per_liter) || []
    const avgKmPerLiter =
        logsWithEfficiency && logsWithEfficiency.length > 0
            ? logsWithEfficiency.reduce((sum, log) => sum + Number(log.km_per_liter), 0) / logsWithEfficiency.length
            : 0
    const totalWorkDistance = allLogs?.reduce((sum, log) => sum + Number(log.work_distance || 0), 0) || 0

    // Get current month stats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthLogs = allLogs?.filter((log) => {
        const logDate = new Date(log.date)
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
    })
    const monthCost = monthLogs?.reduce((sum, log) => sum + Number(log.total_cost), 0) || 0

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600">Welcome back! Here's an overview of your fuel tracking.</p>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Vehicles</CardTitle>
                        <Car className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cars?.length || 0}</div>
                        <p className="text-xs text-slate-600">Registered vehicles</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Spent</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R {totalCost.toFixed(2)}</div>
                        <p className="text-xs text-slate-600">All time fuel costs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Avg. Efficiency</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgKmPerLiter.toFixed(2)} km/L</div>
                        <p className="text-xs text-slate-600">Across all vehicles</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Work Travel</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWorkDistance.toFixed(0)} km</div>
                        <p className="text-xs text-slate-600">For SARS reporting</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Overview */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R {monthCost.toFixed(2)}</div>
                        <p className="text-xs text-slate-600">{monthLogs?.length || 0} fuel entries</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Fuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLiters.toFixed(2)} L</div>
                        <p className="text-xs text-slate-600">All time consumption</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFuelLogs}</div>
                        <p className="text-xs text-slate-600">Fuel log records</p>
                    </CardContent>
                </Card>
            </div>

            {/* Fuel Efficiency Chart */}
            {allLogs && allLogs.length > 0 && (
                <div className="mb-8">
                    <FuelEfficiencyChart logs={allLogs} />
                </div>
            )}

            {/* Recent Activity */}
            <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Recent Fuel Logs</h2>
                    {recentLogs && recentLogs.length > 0 && <ExportLogsButton buttonText="Email All Logs" />}
                </div>

                {recentLogs && recentLogs.length > 0 ? (
                    <div className="space-y-3">
                        {recentLogs.map((log: any) => (
                            <Card key={log.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                            <Fuel className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {log.car?.make} {log.car?.model}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {new Date(log.date).toLocaleDateString("en-ZA")} • {Number(log.liters).toFixed(2)} L
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900">R {Number(log.total_cost).toFixed(2)}</p>
                                        {log.km_per_liter && (
                                            <p className="text-sm text-slate-600">{Number(log.km_per_liter).toFixed(2)} km/L</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Fuel className="mb-2 h-8 w-8 text-slate-400" />
                            <p className="text-sm text-slate-600">No recent fuel logs</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Cars Section */}
            <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Your Vehicles</h2>
                    <Button asChild size="sm">
                        <Link href="/dashboard/cars/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vehicle
                        </Link>
                    </Button>
                </div>

                {cars && cars.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cars.map((car: CarType) => (
                            <Card key={car.id} className="transition-shadow hover:shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="h-5 w-5 text-emerald-600" />
                                        {car.make} {car.model}
                                    </CardTitle>
                                    <CardDescription>
                                        {car.year} • {car.registration_number}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                                        <Link href={`/dashboard/cars/${car.id}`}>View Details</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Car className="mb-4 h-12 w-12 text-slate-400" />
                            <h3 className="mb-2 text-lg font-semibold text-slate-900">No vehicles yet</h3>
                            <p className="mb-4 text-center text-sm text-slate-600">
                                Add your first vehicle to start tracking fuel consumption
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/cars/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Vehicle
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
