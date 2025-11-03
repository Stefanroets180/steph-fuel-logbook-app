import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Car, Plus } from "lucide-react"
import type { Car as CarType } from "@/lib/types"

export default async function CarsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: cars } = await supabase
    .from("cars")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Vehicles</h1>
          <p className="text-slate-600">Manage your registered vehicles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cars/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {cars && cars.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car: CarType) => (
            <Card key={car.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-emerald-600" />
                  {car.make} {car.model}
                </CardTitle>
                <CardDescription>
                  {car.year} • {car.registration_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
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
  )
}
