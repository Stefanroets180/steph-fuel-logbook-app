import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToS3 } from "@/lib/aws-s3"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"

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

        // Get form data
        const formData = await request.formData()
        const file = formData.get("file") as File
        const carId = formData.get("carId") as string
        const logId = formData.get("logId") as string

        if (!file || !carId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Convert image to AVIF format using sharp
        const avifBuffer = await sharp(buffer)
            .avif({
                quality: 80,
                effort: 4,
            })
            .toBuffer()

        // Ensure consistent S3 key path - should be receipts/userId/carId/logId-timestamp.avif
        const timestamp = Date.now()
        const s3Key = `receipts/${user.id}/${carId}/${logId || uuidv4()}-${timestamp}.avif`

        // Upload to S3
        const s3Url = await uploadToS3(s3Key, avifBuffer, "image/avif")

        // If logId is provided, update the fuel log with the receipt URL
        if (logId) {
            const { error: updateError } = await supabase
                .from("fuel_logs")
                .update({ receipt_url: s3Url })
                .eq("id", logId)
                .eq("user_id", user.id)

            if (updateError) {
                throw updateError
            }
        }

        return NextResponse.json({
            success: true,
            url: s3Url,
            key: s3Key,
        })
    } catch (error) {
        console.error("[v0] Receipt upload error:", error)
        return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 })
    }
}
