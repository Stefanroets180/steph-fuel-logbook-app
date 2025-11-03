import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendFuelLogEmail } from "@/lib/email"
import type { FuelLog } from "@/lib/types"

/**
 * API endpoint to send user's fuel logbook and receipts via email
 * Supports SARS compliance documentation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering (optional)
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get("carId")

    let query = supabase.from("fuel_logs").select("*").eq("user_id", user.id).order("date", { ascending: false })

    if (carId) {
      query = query.eq("car_id", carId)
    }

    const { data: fuelLogs, error: logsError } = await query

    if (logsError) {
      throw logsError
    }

    if (!fuelLogs || fuelLogs.length === 0) {
      return NextResponse.json({ error: "No fuel logs found" }, { status: 404 })
    }

    // Get unique car IDs from fuel logs
    const carIds = [...new Set((fuelLogs as FuelLog[]).map((log) => log.car_id))]

    // Fetch cars
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("*")
      .in("id", carIds)
      .eq("user_id", user.id)

    if (carsError) {
      throw carsError
    }

    // Send email
    const result = await sendFuelLogEmail(user.email || "", cars || [], fuelLogs as FuelLog[])

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      logsCount: fuelLogs.length,
      carsCount: cars?.length || 0,
    })
  } catch (error) {
    console.error("Export logs email error:", error)
    return NextResponse.json({ error: "Failed to export logs to email" }, { status: 500 })
  }
}
