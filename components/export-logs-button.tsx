"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ExportLogsButtonProps {
  carId?: string
  buttonText?: string
}

export function ExportLogsButton({ carId, buttonText = "Email Logbook" }: ExportLogsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)

    try {
      const url = carId ? `/api/export-logs-email?carId=${carId}` : "/api/export-logs-email"

      const response = await fetch(url, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send email")
        return
      }

      toast.success(`Email sent! ${data.logsCount} logs from ${data.carsCount} vehicle(s)`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to send email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  )
}
