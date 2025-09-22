import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Settings,
  Database,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { UserManagement } from "@/components/admin/user-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { AuditLogs } from "@/components/admin/audit-logs"
import { SystemHealth } from "@/components/admin/system-health"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user has admin permissions
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get system statistics
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalQRCodes },
    { count: pendingApprovals },
    { count: systemErrors },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("qr_codes").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "ERROR"),
  ])

  // Get recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get recent audit logs
  const { data: recentLogs } = await supabase
    .from("audit_logs")
    .select(`
      *,
      profiles (
        name,
        employee_id
      ),
      qr_codes (
        qr_code
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10)

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
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
                  <p className="text-sm text-muted-foreground">System administration and management</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              Administrator
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{activeUsers || 0} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalQRCodes || 0}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApprovals || 0}</div>
              <p className="text-xs text-muted-foreground">User registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {systemErrors && systemErrors > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${systemErrors && systemErrors > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {systemErrors && systemErrors > 0 ? "Issues" : "Healthy"}
              </div>
              <p className="text-xs text-muted-foreground">{systemErrors || 0} errors logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/users/new">
            <Button className="w-full h-16 flex flex-col gap-2 bg-transparent" variant="outline">
              <Plus className="h-5 w-5" />
              Add User
            </Button>
          </Link>

          <Link href="/admin/settings">
            <Button className="w-full h-16 flex flex-col gap-2 bg-transparent" variant="outline">
              <Settings className="h-5 w-5" />
              System Settings
            </Button>
          </Link>

          <Link href="/admin/backup">
            <Button className="w-full h-16 flex flex-col gap-2 bg-transparent" variant="outline">
              <Database className="h-5 w-5" />
              Backup Data
            </Button>
          </Link>

          <Link href="/admin/logs">
            <Button className="w-full h-16 flex flex-col gap-2 bg-transparent" variant="outline">
              <Activity className="h-5 w-5" />
              View Logs
            </Button>
          </Link>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement users={recentUsers || []} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <AuditLogs logs={recentLogs || []} />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <SystemHealth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
