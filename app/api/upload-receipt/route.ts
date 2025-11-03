import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToS3, generateReceiptKey } from "@/lib/aws-s3"
import sharp from "sharp"

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

    // Generate S3 key
    const s3Key = generateReceiptKey(user.id, carId, logId || "temp")

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
    console.error("Receipt upload error:", error)
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 })
  }
}
