import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deleteFromS3 } from "@/lib/aws-s3"

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

    const { logId, receiptUrl } = await request.json()

    if (!logId || !receiptUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the log belongs to the user
    const { data: log } = await supabase.from("fuel_logs").select("*").eq("id", logId).eq("user_id", user.id).single()

    if (!log) {
      return NextResponse.json({ error: "Fuel log not found" }, { status: 404 })
    }

    // Extract S3 key from URL
    const urlParts = receiptUrl.split(".amazonaws.com/")
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: "Invalid receipt URL" }, { status: 400 })
    }
    const s3Key = urlParts[1]

    // Delete from S3
    await deleteFromS3(s3Key)

    // Update database
    const { error: updateError } = await supabase
      .from("fuel_logs")
      .update({ receipt_url: null })
      .eq("id", logId)
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Receipt deletion error:", error)
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 })
  }
}
