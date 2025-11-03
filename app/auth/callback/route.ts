import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Auth callback handler for email confirmation links
 * Fixes Safari compatibility issues by handling the auth exchange server-side
 * instead of relying on client-side window.location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const response = NextResponse.redirect(new URL(next, request.url))
        return response
      }
    }

    // If there's an error, redirect to auth error page
    return NextResponse.redirect(new URL("/auth/auth-error", request.url))
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/auth/auth-error", request.url))
  }
}
