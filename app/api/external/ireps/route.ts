import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/external/ireps - Integration endpoint for IREPS UDM system
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Validate API key for external integration
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.IREPS_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields for IREPS integration
    const requiredFields = ["action", "data"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    switch (body.action) {
      case "sync_track_fittings":
        // Sync track fitting data from IREPS UDM
        const fittingData = body.data
        const { data: syncedFitting, error: syncError } = await supabase
          .from("track_fittings")
          .upsert(
            {
              part_number: fittingData.part_number,
              name: fittingData.name,
              specifications: fittingData.specifications,
              manufacturer: fittingData.manufacturer,
              material: fittingData.material,
              weight_kg: fittingData.weight_kg,
              dimensions: fittingData.dimensions,
              safety_standards: fittingData.safety_standards,
            },
            { onConflict: "part_number" },
          )
          .select()

        if (syncError) {
          return NextResponse.json({ error: syncError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Track fitting synced successfully",
          data: syncedFitting,
        })

      case "get_qr_status":
        // Get QR code status for IREPS
        const qrCode = body.data.qr_code
        const { data: qrData, error: qrError } = await supabase
          .from("qr_codes")
          .select(`
            *,
            track_fittings (
              name,
              part_number,
              manufacturer
            )
          `)
          .eq("qr_code", qrCode)
          .single()

        if (qrError) {
          if (qrError.code === "PGRST116") {
            return NextResponse.json({ error: "QR code not found" }, { status: 404 })
          }
          return NextResponse.json({ error: qrError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          data: {
            qr_code: qrData.qr_code,
            status: qrData.status,
            location: {
              zone: qrData.zone,
              division: qrData.division,
              section: qrData.section,
              km_post: qrData.km_post,
            },
            track_fitting: qrData.track_fittings,
            last_updated: qrData.updated_at,
          },
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
