import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/qr-codes - Retrieve QR codes with filtering
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
    let query = supabase.from("qr_codes").select(`
      *,
      track_fittings (
        id,
        name,
        part_number,
        specifications,
        manufacturer,
        material,
        weight_kg
      ),
      profiles!qr_codes_created_by_fkey (
        name,
        employee_id
      )
    `)

    // Apply filters
    const status = searchParams.get("status")
    const zone = searchParams.get("zone")
    const division = searchParams.get("division")
    const section = searchParams.get("section")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (status) query = query.eq("status", status)
    if (zone) query = query.eq("zone", zone)
    if (division) query = query.eq("division", division)
    if (section) query = query.eq("section", section)

    // Apply pagination
    if (limit) query = query.limit(Number.parseInt(limit))
    if (offset)
      query = query.range(
        Number.parseInt(offset || "0"),
        Number.parseInt(offset || "0") + Number.parseInt(limit || "50") - 1,
      )

    query = query.order("created_at", { ascending: false })

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

// POST /api/qr-codes - Create new QR code
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

    // Check user permissions
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["fitting_id", "zone", "division", "section", "km_post"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Generate QR code
    const timestamp = Date.now().toString()
    const qrCode = `IR${timestamp}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    // Prepare location details
    const locationDetails = {
      description: body.location_details || null,
      coordinates: body.coordinates || null,
      landmarks: body.landmarks || null,
    }

    // Insert QR code record
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        qr_code: qrCode,
        fitting_id: body.fitting_id,
        batch_number: body.batch_number || null,
        manufacturing_date: body.manufacturing_date || null,
        installation_date: body.installation_date || null,
        location_details: locationDetails,
        zone: body.zone,
        division: body.division,
        section: body.section,
        km_post: body.km_post,
        track_number: body.track_number || null,
        status: "active",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "QR code created successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
