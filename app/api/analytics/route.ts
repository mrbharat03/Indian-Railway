import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/analytics - Get system analytics data
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

    // Check user permissions for analytics
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const zone = searchParams.get("zone")
    const division = searchParams.get("division")

    // Get basic counts
    const [
      { count: totalQRCodes },
      { count: activeQRCodes },
      { count: inactiveQRCodes },
      { count: maintenanceQRCodes },
      { count: totalInspections },
      { count: pendingInspections },
      { count: totalMaintenance },
      { count: emergencyMaintenance },
    ] = await Promise.all([
      supabase.from("qr_codes").select("*", { count: "exact", head: true }),
      supabase.from("qr_codes").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("qr_codes").select("*", { count: "exact", head: true }).eq("status", "inactive"),
      supabase.from("qr_codes").select("*", { count: "exact", head: true }).eq("status", "maintenance"),
      supabase.from("inspections").select("*", { count: "exact", head: true }),
      supabase.from("inspections").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("maintenance_records").select("*", { count: "exact", head: true }),
      supabase
        .from("maintenance_records")
        .select("*", { count: "exact", head: true })
        .eq("maintenance_type", "emergency"),
    ])

    // Get zone-wise distribution
    const { data: zoneData } = await supabase.from("qr_codes").select("zone")
    const zoneStats = zoneData
      ? Object.entries(
          zoneData.reduce((acc: Record<string, number>, item) => {
            acc[item.zone] = (acc[item.zone] || 0) + 1
            return acc
          }, {}),
        ).map(([zone, count]) => ({ zone, count }))
      : []

    // Get condition ratings distribution
    const { data: conditionData } = await supabase.from("inspections").select("condition_rating")
    const conditionStats = conditionData
      ? Object.entries(
          conditionData.reduce((acc: Record<number, number>, item) => {
            if (item.condition_rating) {
              acc[item.condition_rating] = (acc[item.condition_rating] || 0) + 1
            }
            return acc
          }, {}),
        ).map(([rating, count]) => ({ rating: Number(rating), count }))
      : []

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("audit_logs")
      .select(`
        *,
        qr_codes (
          qr_code,
          track_fittings (
            name
          )
        ),
        profiles (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    const analytics = {
      summary: {
        total_qr_codes: totalQRCodes || 0,
        active_qr_codes: activeQRCodes || 0,
        inactive_qr_codes: inactiveQRCodes || 0,
        maintenance_qr_codes: maintenanceQRCodes || 0,
        total_inspections: totalInspections || 0,
        pending_inspections: pendingInspections || 0,
        total_maintenance: totalMaintenance || 0,
        emergency_maintenance: emergencyMaintenance || 0,
        health_score: totalQRCodes ? Math.round(((activeQRCodes || 0) / totalQRCodes) * 100) : 0,
        inspection_rate: totalQRCodes ? Math.round(((totalInspections || 0) / totalQRCodes) * 100) : 0,
      },
      distributions: {
        zones: zoneStats,
        condition_ratings: conditionStats,
      },
      recent_activity: recentActivity || [],
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
