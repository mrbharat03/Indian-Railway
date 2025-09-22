import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/inspections - Get inspections with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build query with filters
    let query = supabase.from("inspections").select(`
      *,
      qr_codes (
        qr_code,
        zone,
        division,
        section,
        km_post,
        track_fittings (
          name,
          part_number
        )
      ),
      profiles!inspections_inspector_id_fkey (
        name,
        employee_id
      )
    `)

    // Apply filters
    const status = searchParams.get("status")
    const inspectionType = searchParams.get("inspection_type")
    const inspectorId = searchParams.get("inspector_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const limit = searchParams.get("limit")

    if (status) query = query.eq("status", status)
    if (inspectionType) query = query.eq("inspection_type", inspectionType)
    if (inspectorId) query = query.eq("inspector_id", inspectorId)
    if (dateFrom) query = query.gte("inspection_date", dateFrom)
    if (dateTo) query = query.lte("inspection_date", dateTo)
    if (limit) query = query.limit(Number.parseInt(limit))

    query = query.order("inspection_date", { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/inspections - Create new inspection
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

    // Validate required fields
    const requiredFields = ["qr_code_id", "inspection_type", "condition_rating"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Prepare defects array
    const defectsArray = body.defects_found
      ? body.defects_found
          .split(",")
          .map((d: string) => d.trim())
          .filter((d: string) => d.length > 0)
      : []

    // Insert inspection record
    const { data, error } = await supabase
      .from("inspections")
      .insert({
        qr_code_id: body.qr_code_id,
        inspector_id: user.id,
        inspection_type: body.inspection_type,
        condition_rating: Number.parseInt(body.condition_rating),
        observations: body.observations || null,
        defects_found: defectsArray,
        recommendations: body.recommendations || null,
        next_inspection_due: body.next_inspection_due || null,
        status: "completed",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Inspection recorded successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
