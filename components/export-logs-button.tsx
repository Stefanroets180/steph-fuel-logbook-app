"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2, Mail } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ExportLogsButtonProps {
    carId?: string
    buttonText?: string
    variant?: "email" | "pdf"
}

export function ExportLogsButton({ carId, buttonText = "Email Logbook", variant = "email" }: ExportLogsButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleExport = async () => {
        setIsLoading(true)

        try {
            if (variant === "email") {
                // Email export
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
            } else {
                // PDF/HTML export
                const url = carId ? `/api/export-logs-pdf?carId=${carId}` : "/api/export-logs-pdf"

                const response = await fetch(url, {
                    method: "POST",
                })

                if (!response.ok) {
                    const data = await response.json()
                    toast.error(data.error || "Failed to export PDF")
                    return
                }

                // Download the HTML file
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = downloadUrl
                a.download = `fuel-logbook-${new Date().toISOString().split("T")[0]}.html`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(downloadUrl)
                document.body.removeChild(a)

                toast.success("PDF downloaded! Open in browser or convert to PDF")
            }
        } catch (error) {
            console.error("[v0] Export error:", error)
            toast.error("Failed to export")
        } finally {
            setIsLoading(false)
        }
    }

    const Icon = variant === "email" ? Mail : Download

    return (
        <Button onClick={handleExport} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {variant === "email" ? "Sending..." : "Downloading..."}
                </>
            ) : (
                <>
                    <Icon className="mr-2 h-4 w-4" />
                    {buttonText}
                </>
            )}
        </Button>
    )
}
