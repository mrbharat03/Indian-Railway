"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewMaintenancePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrId = searchParams.get("qr_id")

  const [qrData, setQrData] = useState<any>(null)
  const [formData, setFormData] = useState({
    maintenance_type: "",
    work_description: "",
    parts_used: "",
    labor_hours: "",
    cost: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qrId) {
      loadQRData()
    }
  }, [qrId])

  const loadQRData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("qr_codes")
        .select(
          `
          *,
          track_fittings (
            name,
            part_number
          )
        `,
        )
        .eq("id", qrId)
        .single()

      if (error) throw error
      setQrData(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Prepare parts used data
      let partsUsed = null
      if (formData.parts_used.trim()) {
        try {
          partsUsed = formData.parts_used
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .map((part) => ({ name: part, quantity: 1 }))
        } catch {
          partsUsed = [{ name: formData.parts_used, quantity: 1 }]
        }
      }

      // Insert maintenance record
      const { error: insertError } = await supabase.from("maintenance_records").insert({
        qr_code_id: qrId,
        technician_id: user.id,
        maintenance_type: formData.maintenance_type,
        work_description: formData.work_description,
        parts_used: partsUsed,
        labor_hours: formData.labor_hours ? Number.parseFloat(formData.labor_hours) : null,
        cost: formData.cost ? Number.parseFloat(formData.cost) : null,
        status: "completed",
      })

      if (insertError) throw insertError

      router.push("/scan")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/scan">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">New Maintenance Record</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {qrData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">{qrData.track_fittings.name}</CardTitle>
              <CardDescription>
                QR: {qrData.qr_code} | Part: {qrData.track_fittings.part_number}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Details</CardTitle>
            <CardDescription>Record maintenance work performed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maintenance_type">Maintenance Type *</Label>
                <Select
                  value={formData.maintenance_type}
                  onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_description">Work Description *</Label>
                <Textarea
                  id="work_description"
                  value={formData.work_description}
                  onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                  placeholder="Describe the maintenance work performed..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parts_used">Parts Used</Label>
                <Textarea
                  id="parts_used"
                  value={formData.parts_used}
                  onChange={(e) => setFormData({ ...formData, parts_used: e.target.value })}
                  placeholder="List parts used separated by commas (e.g., bolt, washer, clip)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labor_hours">Labor Hours</Label>
                  <Input
                    id="labor_hours"
                    type="number"
                    step="0.5"
                    value={formData.labor_hours}
                    onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                    placeholder="e.g., 2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="e.g., 1500.00"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Maintenance Record"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
