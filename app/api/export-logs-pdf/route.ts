import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateFuelLogsHtml } from "@/lib/email"
import type { FuelLog } from "@/lib/types"

/**
 * API endpoint to export fuel logbook as PDF-ready HTML
 * Can be used with tools like Puppeteer or saved directly as HTML
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

    // Calculate statistics
    const totalCost = fuelLogs.reduce((sum, log) => sum + Number(log.total_cost), 0)
    const totalLiters = fuelLogs.reduce((sum, log) => sum + Number(log.liters), 0)
    const totalWorkDistance = fuelLogs.reduce((sum, log) => sum + Number(log.work_distance || 0), 0)
    const averageKmPerLiter =
      fuelLogs.length > 0
        ? fuelLogs.reduce((sum, log) => sum + (Number(log.km_per_liter) || 0), 0) /
          fuelLogs.filter((log) => log.km_per_liter).length
        : 0

    const stats = {
      totalCost,
      totalLiters,
      totalWorkDistance,
      averageKmPerLiter,
      vehicleCount: cars?.length || 0,
    }

    // Generate HTML content
    const htmlContent = generateFuelLogsHtml(user.email || "", cars || [], fuelLogs as FuelLog[], stats)

    // Return HTML with proper headers for download
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="fuel-logbook-${new Date().toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("[v0] Export logs PDF error:", error)
    return NextResponse.json({ error: "Failed to export logs" }, { status: 500 })
  }
}
