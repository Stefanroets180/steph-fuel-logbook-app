import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddCarForm } from "@/components/add-car-form"

export default async function NewCarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Add New Vehicle</h1>
        <p className="text-slate-600">Register a new vehicle to start tracking fuel consumption</p>
      </div>

      <AddCarForm />
    </div>
  )
}
