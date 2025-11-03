"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock, Unlock, Trash2, Receipt, Calendar, Fuel } from "lucide-react"
import Link from "next/link"
import type { Car, FuelLog } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface FuelLogDetailProps {
  car: Car
  fuelLog: FuelLog
}

export function FuelLogDetail({ car, fuelLog }: FuelLogDetailProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)
    setError(null)

    const supabase = createClient()

    try {
      // Delete receipt from S3 if exists
      if (fuelLog.receipt_url) {
        await fetch("/api/delete-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logId: fuelLog.id,
            receiptUrl: fuelLog.receipt_url,
          }),
        })
      }

      // Delete fuel log
      const { error: deleteError } = await supabase.from("fuel_logs").delete().eq("id", fuelLog.id)

      if (deleteError) throw deleteError

      router.push(`/dashboard/cars/${car.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete fuel log")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleLock = async () => {
    setIsLocking(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("fuel_logs")
        .update({ is_locked: !fuelLog.is_locked })
        .eq("id", fuelLog.id)

      if (updateError) throw updateError

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle lock")
    } finally {
      setIsLocking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/cars/${car.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicle
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button
            variant={fuelLog.is_locked ? "default" : "outline"}
            size="sm"
            onClick={handleToggleLock}
            disabled={isLocking}
          >
            {fuelLog.is_locked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={fuelLog.is_locked}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fuel Log</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this fuel log entry and any associated
                  receipt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm">Type DELETE to confirm</Label>
                  <Input
                    id="confirm"
                    placeholder="DELETE"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting || deleteConfirmation !== "DELETE"}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {new Date(fuelLog.date).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
              <CardDescription>
                {car.make} {car.model} • {car.registration_number}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {fuelLog.is_work_travel && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Work Travel
                </Badge>
              )}
              {fuelLog.is_locked && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Lock className="mr-1 h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Odometer Reading</p>
                <p className="text-2xl font-bold">{Number(fuelLog.odometer_reading).toFixed(0)} km</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Fuel Amount</p>
                <p className="text-2xl font-bold">{Number(fuelLog.liters).toFixed(2)} L</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Price per Liter</p>
                <p className="text-2xl font-bold">R {Number(fuelLog.price_per_liter).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Cost</p>
                <p className="text-2xl font-bold text-emerald-600">R {Number(fuelLog.total_cost).toFixed(2)}</p>
              </div>

              {fuelLog.petrol_station && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Petrol Station</p>
                  <p className="text-lg font-semibold">{fuelLog.petrol_station}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-600">Date Added</p>
                <p className="text-sm text-slate-900">
                  {new Date(fuelLog.created_at).toLocaleDateString("en-ZA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Efficiency Stats */}
          {fuelLog.km_per_liter && (
            <div className="rounded-lg bg-emerald-50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-emerald-900">Fuel Efficiency</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-emerald-800">Kilometers per Liter</p>
                  <p className="text-3xl font-bold text-emerald-900">{Number(fuelLog.km_per_liter).toFixed(2)} km/L</p>
                </div>
                {fuelLog.distance_traveled && (
                  <div>
                    <p className="text-sm text-emerald-800">Distance Traveled</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {Number(fuelLog.distance_traveled).toFixed(0)} km
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Work Travel */}
          {fuelLog.is_work_travel && (
            <div className="rounded-lg bg-blue-50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Work Travel (SARS)</h3>
              </div>
              <div>
                <p className="text-sm text-blue-800">Work Distance</p>
                <p className="text-3xl font-bold text-blue-900">{Number(fuelLog.work_distance).toFixed(0)} km</p>
              </div>
            </div>
          )}

          {/* Receipt */}
          {fuelLog.receipt_url && (
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Receipt</h3>
              </div>
              <div className="flex justify-center">
                <img
                  src={fuelLog.receipt_url || "/placeholder.svg"}
                  alt="Fuel receipt"
                  className="max-h-96 rounded-lg border shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {fuelLog.notes && (
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Notes</h3>
              <p className="text-slate-700">{fuelLog.notes}</p>
            </div>
          )}

          {/* Lock Warning */}
          {fuelLog.is_locked && (
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">This entry is locked</p>
                  <p className="text-sm text-amber-800">
                    Locked entries cannot be deleted. Unlock this entry to enable deletion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
