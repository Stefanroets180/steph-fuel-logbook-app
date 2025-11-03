"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function AddCarForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        registration_number: "",
        fuel_tank_capacity: "",
    })

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

            const { error: insertError } = await supabase.from("cars").insert({
                user_id: user.id,
                make: formData.make,
                model: formData.model,
                year: formData.year,
                registration_number: formData.registration_number.toUpperCase(),
                fuel_tank_capacity: formData.fuel_tank_capacity ? Number(formData.fuel_tank_capacity) : null,
            })

            if (insertError) throw insertError

            router.push("/dashboard/cars")
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add vehicle")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="mb-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/cars">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Vehicles
                        </Link>
                    </Button>
                </div>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>Enter the details of your vehicle</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="make">Make</Label>
                            <Input
                                id="make"
                                placeholder="e.g., Toyota"
                                required
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input
                                id="model"
                                placeholder="e.g., Corolla"
                                required
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registration">Registration Number</Label>
                            <Input
                                id="registration"
                                placeholder="e.g., ABC123GP"
                                required
                                value={formData.registration_number}
                                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tank-capacity">Fuel Tank Capacity (Liters) - Optional</Label>
                            <Input
                                id="tank-capacity"
                                type="number"
                                step="0.1"
                                placeholder="e.g., 60"
                                value={formData.fuel_tank_capacity}
                                onChange={(e) => setFormData({ ...formData, fuel_tank_capacity: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

                    <div className="flex gap-4">
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? "Adding Vehicle..." : "Add Vehicle"}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/dashboard/cars">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
