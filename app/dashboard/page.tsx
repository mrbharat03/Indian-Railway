import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Plus, Search, BarChart3, Settings, User } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/ui/logout-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get recent QR codes
  const { data: recentQRCodes } = await supabase
    .from("qr_codes")
    .select(`
      *,
      track_fittings (
        name,
        part_number
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get system stats
  const { count: totalQRCodes } = await supabase.from("qr_codes").select("*", { count: "exact", head: true })

  const { count: activeQRCodes } = await supabase
    .from("qr_codes")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: pendingInspections } = await supabase
    .from("inspections")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Railway QR System</h1>
                <p className="text-sm text-muted-foreground">Smart Track Fitting Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{profile?.role}</Badge>
              <span className="text-sm text-muted-foreground">Welcome, {profile?.name}</span>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQRCodes || 0}</div>
              <p className="text-xs text-muted-foreground">Track fittings registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Fittings</CardTitle>
              <Badge className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeQRCodes || 0}</div>
              <p className="text-xs text-muted-foreground">Currently in service</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInspections || 0}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/qr-codes/generate">
            <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <Plus className="h-6 w-6" />
              Generate QR Code
            </Button>
          </Link>

          <Link href="/scan">
            <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <Search className="h-6 w-6" />
              Scan QR Code
            </Button>
          </Link>

          <Link href="/analytics">
            <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <BarChart3 className="h-6 w-6" />
              View Analytics
            </Button>
          </Link>

          <Link href="/settings">
            <Button className="w-full h-20 flex flex-col gap-2 bg-transparent" variant="outline">
              <Settings className="h-6 w-6" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Recent QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent QR Codes</CardTitle>
            <CardDescription>Latest track fittings registered in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQRCodes && recentQRCodes.length > 0 ? (
              <div className="space-y-4">
                {recentQRCodes.map((qr) => (
                  <div key={qr.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <QrCode className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{qr.qr_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {qr.track_fittings?.name} - {qr.track_fittings?.part_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {qr.zone} | {qr.section} | KM {qr.km_post}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={qr.status === "active" ? "default" : "secondary"}>{qr.status}</Badge>
                      <Link href={`/qr-codes/${qr.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No QR codes generated yet</p>
                <Link href="/qr-codes/generate">
                  <Button className="mt-4">Generate First QR Code</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
