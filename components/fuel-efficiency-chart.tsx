"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { FuelLog } from "@/lib/types"

interface FuelEfficiencyChartProps {
  logs: FuelLog[]
}

export function FuelEfficiencyChart({ logs }: FuelEfficiencyChartProps) {
  // Prepare chart data - only include logs with km_per_liter
  const chartData = logs
    .filter((log) => log.km_per_liter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10) // Last 10 entries
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
      efficiency: Number(log.km_per_liter),
      cost: Number(log.total_cost),
    }))

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Efficiency Trend</CardTitle>
        <CardDescription>Your fuel consumption over the last 10 fill-ups</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number, name: string) => {
                if (name === "efficiency") return [`${value.toFixed(2)} km/L`, "Efficiency"]
                if (name === "cost") return [`R ${value.toFixed(2)}`, "Cost"]
                return [value, name]
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="hsl(160 84% 39%)"
              strokeWidth={2}
              dot={{ fill: "hsl(160 84% 39%)" }}
              name="Efficiency (km/L)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
