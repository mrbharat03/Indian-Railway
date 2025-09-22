import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/health - System health check endpoint
export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    // Get system statistics
    const [{ count: totalQRCodes }, { count: totalUsers }, { count: totalInspections }] = await Promise.all([
      supabase.from("qr_codes").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("inspections").select("*", { count: "exact", head: true }),
    ])

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      statistics: {
        total_qr_codes: totalQRCodes || 0,
        total_users: totalUsers || 0,
        total_inspections: totalInspections || 0,
      },
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
