"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Search, FileText, User } from "lucide-react"

interface Activity {
  id: string
  action: string
  details: any
  created_at: string
  qr_codes?: {
    qr_code: string
    track_fittings?: {
      name: string
    }
  }
  profiles?: {
    name: string
  }
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "QR_SCAN":
        return <Search className="h-4 w-4 text-blue-500" />
      case "INSERT":
        return <QrCode className="h-4 w-4 text-green-500" />
      case "UPDATE":
        return <FileText className="h-4 w-4 text-yellow-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "QR_SCAN":
        return "QR Code Scanned"
      case "INSERT":
        return "New Record Created"
      case "UPDATE":
        return "Record Updated"
      case "DELETE":
        return "Record Deleted"
      default:
        return action.replace("_", " ")
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "QR_SCAN":
        return "bg-blue-50 text-blue-700"
      case "INSERT":
        return "bg-green-50 text-green-700"
      case "UPDATE":
        return "bg-yellow-50 text-yellow-700"
      case "DELETE":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent System Activity</CardTitle>
        <CardDescription>Latest actions performed in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">{getActionIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={getActionColor(activity.action)}>
                      {getActionLabel(activity.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{activity.profiles?.name || "System User"}</p>
                    {activity.qr_codes && (
                      <p className="text-muted-foreground">
                        {activity.qr_codes.track_fittings?.name} - {activity.qr_codes.qr_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
