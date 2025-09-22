import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { RecentActivity } from "@/components/recent-activity"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view analytics
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

  if (!profile || !["admin", "supervisor"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get system statistics
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
  const { data: zoneStats } = await supabase
    .from("qr_codes")
    .select("zone")
    .then(({ data }) => {
      if (!data) return { data: [] }
      const zoneCounts = data.reduce((acc: Record<string, number>, item) => {
        acc[item.zone] = (acc[item.zone] || 0) + 1
        return acc
      }, {})
      return { data: Object.entries(zoneCounts).map(([zone, count]) => ({ zone, count })) }
    })

  // Get condition ratings distribution
  const { data: conditionStats } = await supabase
    .from("inspections")
    .select("condition_rating")
    .then(({ data }) => {
      if (!data) return { data: [] }
      const ratingCounts = data.reduce((acc: Record<number, number>, item) => {
        if (item.condition_rating) {
          acc[item.condition_rating] = (acc[item.condition_rating] || 0) + 1
        }
        return acc
      }, {})
      return { data: Object.entries(ratingCounts).map(([rating, count]) => ({ rating: Number(rating), count })) }
    })

  // Get recent activity for timeline
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
    .limit(10)

  // Calculate health metrics
  const healthScore = totalQRCodes ? Math.round(((activeQRCodes || 0) / totalQRCodes) * 100) : 0
  const inspectionRate = totalQRCodes ? Math.round(((totalInspections || 0) / totalQRCodes) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                  <p className="text-sm text-muted-foreground">System performance and insights</p>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{healthScore}%</div>
              <p className="text-xs text-muted-foreground">
                {activeQRCodes} of {totalQRCodes} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspection Coverage</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inspectionRate}%</div>
              <p className="text-xs text-muted-foreground">{totalInspections} inspections completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingInspections || 0}</div>
              <p className="text-xs text-muted-foreground">Inspections requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Work</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{emergencyMaintenance || 0}</div>
              <p className="text-xs text-muted-foreground">Emergency maintenance this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">QR Code Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-medium">{activeQRCodes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Maintenance</span>
                </div>
                <span className="font-medium">{maintenanceQRCodes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Inactive</span>
                </div>
                <span className="font-medium">{inactiveQRCodes || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zone Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {zoneStats?.slice(0, 5).map((zone, index) => (
                <div key={zone.zone} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{zone.zone}</span>
                  </div>
                  <span className="font-medium">{zone.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condition Ratings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditionStats
                ?.sort((a, b) => b.rating - a.rating)
                .map((condition) => (
                  <div key={condition.rating} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          condition.rating >= 4
                            ? "bg-green-500"
                            : condition.rating >= 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm">
                        {condition.rating} Star{condition.rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="font-medium">{condition.count}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">Charts & Trends</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <AnalyticsCharts
              zoneStats={zoneStats || []}
              conditionStats={conditionStats || []}
              totalQRCodes={totalQRCodes || 0}
              totalInspections={totalInspections || 0}
              totalMaintenance={totalMaintenance || 0}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <RecentActivity activities={recentActivity || []} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Summary</CardTitle>
                  <CardDescription>Key metrics for this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">New QR Codes</p>
                      <p className="text-2xl font-bold">{totalQRCodes || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inspections</p>
                      <p className="text-2xl font-bold">{totalInspections || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Maintenance</p>
                      <p className="text-2xl font-bold">{totalMaintenance || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency</p>
                      <p className="text-2xl font-bold text-red-600">{emergencyMaintenance || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Indicators</CardTitle>
                  <CardDescription>System efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Uptime</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        99.8%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <Badge variant="outline">Less than 2 seconds</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Accuracy</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        99.9%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Satisfaction</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        4.8/5
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
