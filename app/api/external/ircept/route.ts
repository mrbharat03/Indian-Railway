import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/external/ircept - Integration endpoint for IRCEPT TMS system
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Validate API key for external integration
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.IRCEPT_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields for IRCEPT integration
    const requiredFields = ["action", "data"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    switch (body.action) {
      case "get_track_status":
        // Get track status for TMS
        const { zone, division, section, km_from, km_to } = body.data

        let query = supabase.from("qr_codes").select(`
          *,
          track_fittings (
            name,
            part_number,
            specifications
          ),
          inspections!inner (
            condition_rating,
            inspection_date,
            defects_found
          )
        `)

        if (zone) query = query.eq("zone", zone)
        if (division) query = query.eq("division", division)
        if (section) query = query.eq("section", section)
        if (km_from && km_to) {
          query = query.gte("km_post", km_from).lte("km_post", km_to)
        }

        const { data: trackData, error: trackError } = await query.order("km_post")

        if (trackError) {
          return NextResponse.json({ error: trackError.message }, { status: 500 })
        }

        // Process data for TMS format
        const processedData = trackData?.map((item) => ({
          qr_code: item.qr_code,
          location: {
            zone: item.zone,
            division: item.division,
            section: item.section,
            km_post: item.km_post,
            track_number: item.track_number,
          },
          fitting: {
            name: item.track_fittings?.name,
            part_number: item.track_fittings?.part_number,
            specifications: item.track_fittings?.specifications,
          },
          status: item.status,
          condition: {
            rating: item.inspections?.[0]?.condition_rating || null,
            last_inspection: item.inspections?.[0]?.inspection_date || null,
            defects: item.inspections?.[0]?.defects_found || [],
          },
        }))

        return NextResponse.json({
          success: true,
          data: processedData,
          count: processedData?.length || 0,
        })

      case "update_maintenance_schedule":
        // Update maintenance schedule from TMS
        const scheduleData = body.data
        const { data: updatedQR, error: updateError } = await supabase
          .from("qr_codes")
          .update({
            status: scheduleData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("qr_code", scheduleData.qr_code)
          .select()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Log the update
        await supabase.from("audit_logs").insert({
          qr_code_id: updatedQR[0]?.id,
          user_id: null, // System update
          action: "TMS_UPDATE",
          details: {
            source: "IRCEPT_TMS",
            schedule_data: scheduleData,
            updated_at: new Date().toISOString(),
          },
        })

        return NextResponse.json({
          success: true,
          message: "Maintenance schedule updated successfully",
          data: updatedQR[0],
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
