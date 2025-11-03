"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

interface AddFuelLogFormProps {
  carId: string
}

export function AddFuelLogForm({ carId }: AddFuelLogFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    odometer_reading: "",
    liters: "",
    price_per_liter: "",
    petrol_station: "",
    is_work_travel: false,
    work_distance: "",
    notes: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setReceiptFile(file)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Calculate total cost
      const totalCost = Number(formData.liters) * Number(formData.price_per_liter)

      // Insert fuel log
      const { data: newLog, error: insertError } = await supabase
        .from("fuel_logs")
        .insert({
          car_id: carId,
          user_id: user.id,
          date: new Date(formData.date).toISOString(),
          odometer_reading: Number(formData.odometer_reading),
          liters: Number(formData.liters),
          price_per_liter: Number(formData.price_per_liter),
          total_cost: totalCost,
          petrol_station: formData.petrol_station || null,
          is_work_travel: formData.is_work_travel,
          work_distance: formData.is_work_travel ? Number(formData.work_distance) : 0,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload receipt if provided
      if (receiptFile && newLog) {
        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", receiptFile)
        uploadFormData.append("carId", carId)
        uploadFormData.append("logId", newLog.id)

        const uploadResponse = await fetch("/api/upload-receipt", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload receipt")
        }
      }

      router.push(`/dashboard/cars/${carId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add fuel log")
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  const totalCost =
    formData.liters && formData.price_per_liter ? Number(formData.liters) * Number(formData.price_per_liter) : 0

  return (
    <Card>
      <CardHeader>
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/cars/${carId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicle
            </Link>
          </Button>
        </div>
        <CardTitle>Fuel Log Details</CardTitle>
        <CardDescription>Enter the details of your fuel purchase</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Odometer */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer Reading (km)</Label>
              <Input
                id="odometer"
                type="number"
                step="0.01"
                placeholder="e.g., 45000"
                required
                value={formData.odometer_reading}
                onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
              />
            </div>
          </div>

          {/* Fuel Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Fuel Purchase</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="liters">Liters</Label>
                <Input
                  id="liters"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 45.5"
                  required
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Liter (ZAR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 22.50"
                  required
                  value={formData.price_per_liter}
                  onChange={(e) => setFormData({ ...formData, price_per_liter: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total">Total Cost (ZAR)</Label>
                <Input id="total" type="text" value={`R ${totalCost.toFixed(2)}`} disabled className="bg-slate-100" />
              </div>
            </div>
          </div>

          {/* Petrol Station */}
          <div className="space-y-2">
            <Label htmlFor="station">Petrol Station (Optional)</Label>
            <Input
              id="station"
              placeholder="e.g., Shell, BP, Engen"
              value={formData.petrol_station}
              onChange={(e) => setFormData({ ...formData, petrol_station: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Receipt (Optional)</h3>
            <div className="space-y-2">
              {!receiptPreview ? (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6">
                  <label htmlFor="receipt" className="cursor-pointer text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload receipt image</p>
                    <p className="text-xs text-slate-500">JPEG, PNG, or other image formats (max 10MB)</p>
                    <input
                      id="receipt"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg border p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={removeReceipt}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img
                    src={receiptPreview || "/placeholder.svg"}
                    alt="Receipt preview"
                    className="mx-auto max-h-64 rounded"
                  />
                  <p className="mt-2 text-center text-sm text-slate-600">
                    Will be converted to AVIF format and uploaded to AWS S3
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Work Travel */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="work-travel"
                checked={formData.is_work_travel}
                onCheckedChange={(checked) => setFormData({ ...formData, is_work_travel: checked as boolean })}
              />
              <Label htmlFor="work-travel" className="cursor-pointer font-medium">
                This is work-related travel (for SARS)
              </Label>
            </div>

            {formData.is_work_travel && (
              <div className="space-y-2">
                <Label htmlFor="work-distance">Work Distance (km)</Label>
                <Input
                  id="work-distance"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150"
                  value={formData.work_distance}
                  onChange={(e) => setFormData({ ...formData, work_distance: e.target.value })}
                />
                <p className="text-xs text-slate-600">Enter the distance traveled for work purposes during this tank</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this fuel purchase..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || isUploading} className="flex-1">
              {isUploading ? "Uploading Receipt..." : isLoading ? "Adding Fuel Log..." : "Add Fuel Log"}
            </Button>
            <Button type="button" variant="outline" asChild disabled={isLoading || isUploading}>
              <Link href={`/dashboard/cars/${carId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
