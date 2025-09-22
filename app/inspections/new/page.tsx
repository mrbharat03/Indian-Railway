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
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

export default function NewInspectionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrId = searchParams.get("qr_id")

  const [qrData, setQrData] = useState<any>(null)
  const [formData, setFormData] = useState({
    inspection_type: "",
    condition_rating: "",
    observations: "",
    defects_found: "",
    recommendations: "",
    next_inspection_due: "",
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

      // Prepare defects array
      const defectsArray = formData.defects_found
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0)

      // Insert inspection record
      const { error: insertError } = await supabase.from("inspections").insert({
        qr_code_id: qrId,
        inspector_id: user.id,
        inspection_type: formData.inspection_type,
        condition_rating: Number.parseInt(formData.condition_rating),
        observations: formData.observations,
        defects_found: defectsArray,
        recommendations: formData.recommendations,
        next_inspection_due: formData.next_inspection_due || null,
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

  const renderStarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setFormData({ ...formData, condition_rating: rating.toString() })}
            className={`p-1 ${Number.parseInt(formData.condition_rating) >= rating ? "text-yellow-500" : "text-gray-300"}`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    )
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
            <h1 className="text-lg font-semibold">New Inspection</h1>
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
            <CardTitle>Inspection Details</CardTitle>
            <CardDescription>Record inspection findings and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="inspection_type">Inspection Type *</Label>
                <Select
                  value={formData.inspection_type}
                  onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition Rating *</Label>
                <div className="flex items-center gap-4">
                  {renderStarRating()}
                  <span className="text-sm text-muted-foreground">
                    {formData.condition_rating ? `${formData.condition_rating}/5` : "Select rating"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="General observations about the fitting condition..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defects_found">Defects Found</Label>
                <Textarea
                  id="defects_found"
                  value={formData.defects_found}
                  onChange={(e) => setFormData({ ...formData, defects_found: e.target.value })}
                  placeholder="List defects separated by commas (e.g., crack, corrosion, loose bolts)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Recommended actions or follow-up required..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_inspection_due">Next Inspection Due</Label>
                <Input
                  id="next_inspection_due"
                  type="date"
                  value={formData.next_inspection_due}
                  onChange={(e) => setFormData({ ...formData, next_inspection_due: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Inspection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
