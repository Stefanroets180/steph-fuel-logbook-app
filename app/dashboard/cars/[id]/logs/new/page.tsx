import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddFuelLogForm } from "@/components/add-fuel-log-form"

export default async function NewFuelLogPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Add Fuel Log</h1>
        <p className="text-slate-600">
          {car.make} {car.model} • {car.registration_number}
        </p>
      </div>

      <AddFuelLogForm carId={id} />
    </div>
  )
}
