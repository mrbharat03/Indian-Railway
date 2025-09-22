import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/maintenance - Get maintenance records with filtering
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
    let query = supabase.from("maintenance_records").select(`
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
      profiles!maintenance_records_technician_id_fkey (
        name,
        employee_id
      )
    `)

    // Apply filters
    const status = searchParams.get("status")
    const maintenanceType = searchParams.get("maintenance_type")
    const technicianId = searchParams.get("technician_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const limit = searchParams.get("limit")

    if (status) query = query.eq("status", status)
    if (maintenanceType) query = query.eq("maintenance_type", maintenanceType)
    if (technicianId) query = query.eq("technician_id", technicianId)
    if (dateFrom) query = query.gte("maintenance_date", dateFrom)
    if (dateTo) query = query.lte("maintenance_date", dateTo)
    if (limit) query = query.limit(Number.parseInt(limit))

    query = query.order("maintenance_date", { ascending: false })

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

// POST /api/maintenance - Create new maintenance record
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
    const requiredFields = ["qr_code_id", "maintenance_type", "work_description"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Prepare parts used data
    let partsUsed = null
    if (body.parts_used && body.parts_used.trim()) {
      try {
        partsUsed = body.parts_used
          .split(",")
          .map((part: string) => part.trim())
          .filter((part: string) => part.length > 0)
          .map((part: string) => ({ name: part, quantity: 1 }))
      } catch {
        partsUsed = [{ name: body.parts_used, quantity: 1 }]
      }
    }

    // Insert maintenance record
    const { data, error } = await supabase
      .from("maintenance_records")
      .insert({
        qr_code_id: body.qr_code_id,
        technician_id: user.id,
        maintenance_type: body.maintenance_type,
        work_description: body.work_description,
        parts_used: partsUsed,
        labor_hours: body.labor_hours ? Number.parseFloat(body.labor_hours) : null,
        cost: body.cost ? Number.parseFloat(body.cost) : null,
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
      message: "Maintenance record created successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
