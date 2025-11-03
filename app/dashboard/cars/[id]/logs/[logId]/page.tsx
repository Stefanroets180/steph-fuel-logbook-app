import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FuelLogDetail } from "@/components/fuel-log-detail"

export default async function FuelLogDetailPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>
}) {
  const { id, logId } = await params
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

  // Fetch fuel log
  const { data: fuelLog } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("id", logId)
    .eq("car_id", id)
    .eq("user_id", user.id)
    .single()

  if (!fuelLog) {
    redirect(`/dashboard/cars/${id}`)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <FuelLogDetail car={car} fuelLog={fuelLog} />
    </div>
  )
}
