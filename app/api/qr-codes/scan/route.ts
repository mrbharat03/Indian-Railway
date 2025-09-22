import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/qr-codes/scan - Record QR code scan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.qr_code) {
      return NextResponse.json({ error: "QR code is required" }, { status: 400 })
    }

    // Find QR code
    const { data: qrData, error: qrError } = await supabase
      .from("qr_codes")
      .select(`
        *,
        track_fittings (
          id,
          name,
          part_number,
          specifications,
          manufacturer,
          material,
          weight_kg
        )
      `)
      .eq("qr_code", body.qr_code)
      .single()

    if (qrError) {
      if (qrError.code === "PGRST116") {
        return NextResponse.json({ error: "QR code not found" }, { status: 404 })
      }
      return NextResponse.json({ error: qrError.message }, { status: 500 })
    }

    // Log the scan activity
    const { error: logError } = await supabase.from("audit_logs").insert({
      qr_code_id: qrData.id,
      user_id: user.id,
      action: "QR_SCAN",
      details: {
        scanned_at: new Date().toISOString(),
        scan_method: body.scan_method || "api",
        location: body.location || null,
        device_info: body.device_info || null,
      },
    })

    if (logError) {
      console.error("Failed to log scan activity:", logError)
    }

    return NextResponse.json({
      success: true,
      data: qrData,
      message: "QR code scanned successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
