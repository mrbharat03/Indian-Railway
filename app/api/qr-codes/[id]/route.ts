import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/qr-codes/[id] - Get specific QR code details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get QR code with related data
    const { data, error } = await supabase
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
          weight_kg,
          dimensions,
          safety_standards
        ),
        profiles!qr_codes_created_by_fkey (
          name,
          employee_id
        ),
        inspections (
          id,
          inspection_date,
          inspection_type,
          condition_rating,
          observations,
          defects_found,
          recommendations,
          status,
          profiles!inspections_inspector_id_fkey (
            name,
            employee_id
          )
        ),
        maintenance_records (
          id,
          maintenance_date,
          maintenance_type,
          work_description,
          parts_used,
          labor_hours,
          cost,
          status,
          profiles!maintenance_records_technician_id_fkey (
            name,
            employee_id
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "QR code not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/qr-codes/[id] - Update QR code
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user permissions
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Update QR code record
    const { data, error } = await supabase
      .from("qr_codes")
      .update({
        status: body.status,
        location_details: body.location_details,
        zone: body.zone,
        division: body.division,
        section: body.section,
        km_post: body.km_post,
        track_number: body.track_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "QR code updated successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
