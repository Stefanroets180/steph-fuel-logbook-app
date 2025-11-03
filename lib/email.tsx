import type { FuelLog, Car } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

interface EmailExportData {
  userEmail: string
  cars: Car[]
  fuelLogs: FuelLog[]
}

/**
 * Generate CSV content for fuel logs
 * Used for email exports and SARS compliance documentation
 */
export async function generateFuelLogsCsv(fuelLogs: FuelLog[], cars: Map<string, Car>): Promise<string> {
  const headers = [
    "Date",
    "Vehicle",
    "Registration",
    "Odometer (km)",
    "Fuel Added (L)",
    "Price Per Liter (R)",
    "Total Cost (R)",
    "Petrol Station",
    "Efficiency (km/L)",
    "Distance Traveled (km)",
    "Work Travel (Y/N)",
    "Work Distance (km)",
    "Receipt Attached",
    "Notes",
  ]

  const rows = fuelLogs.map((log) => {
    const car = cars.get(log.car_id)
    return [
      new Date(log.date).toLocaleDateString("en-ZA"),
      car ? `${car.make} ${car.model}` : "Unknown",
      car?.registration_number || "",
      log.odometer_reading.toFixed(2),
      log.liters.toFixed(2),
      log.price_per_liter.toFixed(2),
      log.total_cost.toFixed(2),
      log.petrol_station || "",
      log.km_per_liter?.toFixed(2) || "",
      log.distance_traveled?.toFixed(2) || "",
      log.is_work_travel ? "Yes" : "No",
      log.work_distance?.toFixed(2) || "0",
      log.receipt_url ? "Yes" : "No",
      log.notes || "",
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
  })

  return [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n")
}

/**
 * Generate HTML email content for fuel logs report
 */
export function generateFuelLogsHtml(
  userEmail: string,
  cars: Car[],
  fuelLogs: FuelLog[],
  stats: {
    totalCost: number
    totalLiters: number
    totalWorkDistance: number
    averageKmPerLiter: number
    vehicleCount: number
  },
): string {
  const carsMap = new Map(cars.map((car) => [car.id, car]))

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .stat-value { font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 5px; }
        .logs-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .logs-table th { background-color: #059669; color: white; padding: 12px; text-align: left; font-size: 12px; }
        .logs-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .logs-table tr:nth-child(even) { background-color: #f9fafb; }
        .work-travel { background-color: #dbeafe; }
        .receipt-badge { display: inline-block; background-color: #e9d5ff; color: #6b21a8; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #6b7280; }
        .sars-note { background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .sars-note strong { color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fuel Logbook Report</h1>
          <p>Generated for ${userEmail} on ${new Date().toLocaleDateString("en-ZA")}</p>
        </div>

        <div class="sars-note">
          <strong>SARS Tax Purposes:</strong> This report includes your work travel distance for SARS (South African Revenue Service) tax deduction purposes. Please keep this documentation for your records.
        </div>

        <div class="stats">
          <div class="stat-box">
            <div class="stat-label">Total Cost</div>
            <div class="stat-value">R ${stats.totalCost.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Fuel Purchased</div>
            <div class="stat-value">${stats.totalLiters.toFixed(2)} L</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Average Efficiency</div>
            <div class="stat-value">${stats.averageKmPerLiter.toFixed(2)} km/L</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Work Travel (SARS)</div>
            <div class="stat-value">${stats.totalWorkDistance.toFixed(0)} km</div>
          </div>
        </div>

        <h2 style="color: #059669; font-size: 18px; margin-top: 30px;">Vehicles (${stats.vehicleCount})</h2>
        <table class="logs-table">
          <thead>
            <tr>
              <th>Make & Model</th>
              <th>Registration</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            ${cars
              .map(
                (car) => `
              <tr>
                <td>${car.make} ${car.model}</td>
                <td>${car.registration_number}</td>
                <td>${car.year}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2 style="color: #059669; font-size: 18px; margin-top: 30px;">Fuel Logs (${fuelLogs.length} entries)</h2>
        <table class="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Liters</th>
              <th>Cost (R)</th>
              <th>Efficiency</th>
              <th>Station</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${fuelLogs
              .map((log) => {
                const car = carsMap.get(log.car_id)
                const rowClass = log.is_work_travel ? "work-travel" : ""
                return `
              <tr class="${rowClass}">
                <td>${new Date(log.date).toLocaleDateString("en-ZA")}</td>
                <td>${car ? `${car.make} ${car.model}` : "Unknown"}</td>
                <td>${log.liters.toFixed(2)}</td>
                <td>R ${log.total_cost.toFixed(2)}</td>
                <td>${log.km_per_liter ? `${log.km_per_liter.toFixed(2)} km/L` : "-"}</td>
                <td>${log.petrol_station || "-"}</td>
                <td>
                  ${log.is_work_travel ? '<span style="color: #0284c7; font-weight: bold;">Work</span>' : ""}
                  ${log.receipt_url ? `<span class="receipt-badge">Receipt</span>` : ""}
                </td>
              </tr>
            `
              })
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automated report from your Fuel Logbook application. Please keep this email for your records.</p>
          <p>For SARS compliance, ensure you maintain receipts for all fuel purchases.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Send fuel logbook report via email
 */
export async function sendFuelLogEmail(
  userEmail: string,
  cars: Car[],
  fuelLogs: FuelLog[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

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
      vehicleCount: cars.length,
    }

    // Generate CSV and HTML content
    const carsMap = new Map(cars.map((car) => [car.id, car]))
    const csvContent = await generateFuelLogsCsv(fuelLogs, carsMap)
    const htmlContent = generateFuelLogsHtml(userEmail, cars, fuelLogs, stats)

    // Use Supabase email function to send via SMTP
    // Note: This uses the custom SMTP configured in Supabase project settings
    const response = await fetch("https://api.supabase.com/v1/auth/admin/email/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        subject: `Fuel Logbook Report - ${new Date().toLocaleDateString("en-ZA")}`,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      // Fallback: If Supabase email fails, return error
      const error = await response.json()
      console.error("Supabase email error:", error)
      return {
        success: false,
        error: "Failed to send email via Supabase SMTP",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Email send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
