"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
} from "lucide-react"

interface SystemMetric {
  name: string
  value: number
  status: "healthy" | "warning" | "critical"
  unit: string
  icon: React.ReactNode
}

export function SystemHealth() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Mock system metrics - in real app, these would come from actual monitoring
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: "CPU Usage",
      value: 45,
      status: "healthy",
      unit: "%",
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      name: "Memory Usage",
      value: 68,
      status: "warning",
      unit: "%",
      icon: <MemoryStick className="h-4 w-4" />,
    },
    {
      name: "Disk Usage",
      value: 32,
      status: "healthy",
      unit: "%",
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      name: "Database Connection",
      value: 100,
      status: "healthy",
      unit: "%",
      icon: <Database className="h-4 w-4" />,
    },
    {
      name: "API Response Time",
      value: 150,
      status: "healthy",
      unit: "ms",
      icon: <Server className="h-4 w-4" />,
    },
    {
      name: "Network Latency",
      value: 25,
      status: "healthy",
      unit: "ms",
      icon: <Wifi className="h-4 w-4" />,
    },
  ])

  const refreshMetrics = async () => {
    setIsLoading(true)
    // Simulate API call to refresh metrics
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update with mock data
    setMetrics((prev) =>
      prev.map((metric) => ({
        ...metric,
        value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 20)),
      })),
    )

    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const overallHealth = metrics.every((m) => m.status === "healthy")
    ? "healthy"
    : metrics.some((m) => m.status === "critical")
      ? "critical"
      : "warning"

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(overallHealth)}
              <div>
                <CardTitle>System Health Status</CardTitle>
                <CardDescription>Last updated: {lastUpdated.toLocaleTimeString()}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(overallHealth)}>{overallHealth.toUpperCase()}</Badge>
              <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <CardTitle className="text-base">{metric.name}</CardTitle>
                </div>
                {getStatusIcon(metric.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value.toFixed(0)}
                    {metric.unit}
                  </span>
                  <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Services */}
      <Card>
        <CardHeader>
          <CardTitle>System Services</CardTitle>
          <CardDescription>Status of critical system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Authentication Service", status: "healthy" },
              { name: "Database Service", status: "healthy" },
              { name: "File Storage Service", status: "healthy" },
              { name: "Email Service", status: "warning" },
              { name: "Backup Service", status: "healthy" },
              { name: "Monitoring Service", status: "healthy" },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <span className="font-medium">{service.name}</span>
                </div>
                <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Alerts</CardTitle>
          <CardDescription>Latest system notifications and warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                message: "High memory usage detected on server",
                time: "2 minutes ago",
                severity: "warning",
              },
              {
                message: "Database backup completed successfully",
                time: "1 hour ago",
                severity: "healthy",
              },
              {
                message: "New user registration pending approval",
                time: "3 hours ago",
                severity: "healthy",
              },
            ].map((alert, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {getStatusIcon(alert.severity)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
