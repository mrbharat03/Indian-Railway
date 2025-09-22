"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface AnalyticsChartsProps {
  zoneStats: Array<{ zone: string; count: number }>
  conditionStats: Array<{ rating: number; count: number }>
  totalQRCodes: number
  totalInspections: number
  totalMaintenance: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsCharts({
  zoneStats,
  conditionStats,
  totalQRCodes,
  totalInspections,
  totalMaintenance,
}: AnalyticsChartsProps) {
  // Mock monthly trend data - in real app, this would come from the database
  const monthlyTrend = [
    { month: "Jan", qrCodes: 45, inspections: 32, maintenance: 12 },
    { month: "Feb", qrCodes: 52, inspections: 41, maintenance: 15 },
    { month: "Mar", qrCodes: 48, inspections: 38, maintenance: 18 },
    { month: "Apr", qrCodes: 61, inspections: 45, maintenance: 14 },
    { month: "May", qrCodes: 55, inspections: 42, maintenance: 16 },
    { month: "Jun", qrCodes: 67, inspections: 51, maintenance: 19 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Zone Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR Codes by Zone</CardTitle>
          <CardDescription>Distribution across railway zones</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Condition Ratings Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condition Ratings</CardTitle>
          <CardDescription>Distribution of inspection ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conditionStats.map((item) => ({ name: `${item.rating} Star`, value: item.count }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {conditionStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Monthly Trends</CardTitle>
          <CardDescription>QR codes, inspections, and maintenance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="qrCodes" stroke="#8884d8" name="QR Codes" />
              <Line type="monotone" dataKey="inspections" stroke="#82ca9d" name="Inspections" />
              <Line type="monotone" dataKey="maintenance" stroke="#ffc658" name="Maintenance" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
