"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { QrCode, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TrackFitting {
  id: string
  name: string
  part_number: string
  category_id: string
}

interface FittingCategory {
  id: string
  name: string
}

export default function GenerateQRCodePage() {
  const [trackFittings, setTrackFittings] = useState<TrackFitting[]>([])
  const [categories, setCategories] = useState<FittingCategory[]>([])
  const [selectedFitting, setSelectedFitting] = useState<string>("")
  const [formData, setFormData] = useState({
    batch_number: "",
    manufacturing_date: "",
    installation_date: "",
    zone: "",
    division: "",
    section: "",
    km_post: "",
    track_number: "",
    location_details: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load categories
    const { data: categoriesData } = await supabase.from("fitting_categories").select("*").order("name")

    if (categoriesData) {
      setCategories(categoriesData)
    }

    // Load track fittings
    const { data: fittingsData } = await supabase.from("track_fittings").select("*").order("name")

    if (fittingsData) {
      setTrackFittings(fittingsData)
    }
  }

  const generateQRCode = async (e: React.FormEvent) => {
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

      // Generate QR code
      const timestamp = Date.now().toString()
      const qrCode = `IR${timestamp}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

      // Prepare location details
      const locationDetails = {
        description: formData.location_details,
        coordinates: null, // Can be added later with GPS
        landmarks: null,
      }

      // Insert QR code record
      const { data, error: insertError } = await supabase
        .from("qr_codes")
        .insert({
          qr_code: qrCode,
          fitting_id: selectedFitting,
          batch_number: formData.batch_number,
          manufacturing_date: formData.manufacturing_date || null,
          installation_date: formData.installation_date || null,
          location_details: locationDetails,
          zone: formData.zone,
          division: formData.division,
          section: formData.section,
          km_post: formData.km_post,
          track_number: formData.track_number,
          status: "active",
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setGeneratedQR(qrCode)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!generatedQR) return

    // Create a simple QR code representation (in real app, use QR code library)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 200
    canvas.height = 200

    // Simple placeholder - in production, use a proper QR code library
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, 200, 200)
    ctx.fillStyle = "#fff"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText(generatedQR, 100, 100)

    // Download
    const link = document.createElement("a")
    link.download = `QR_${generatedQR}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  if (generatedQR) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">QR Code Generated</h1>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-green-600">Success!</CardTitle>
                <CardDescription>Your QR code has been generated and saved to the system</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-2" />
                    <p className="text-sm font-mono">{generatedQR}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">QR Code: {generatedQR}</p>
                  <p className="text-sm text-muted-foreground">
                    Location: {formData.zone} | {formData.section} | KM {formData.km_post}
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Link href="/qr-codes/generate">
                    <Button variant="outline">Generate Another</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Generate QR Code</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Track Fitting Registration</CardTitle>
              <CardDescription>Create a new QR code for a track fitting component</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generateQRCode} className="space-y-6">
                {/* Track Fitting Selection */}
                <div className="space-y-2">
                  <Label htmlFor="fitting">Track Fitting *</Label>
                  <Select value={selectedFitting} onValueChange={setSelectedFitting} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a track fitting" />
                    </SelectTrigger>
                    <SelectContent>
                      {trackFittings.map((fitting) => (
                        <SelectItem key={fitting.id} value={fitting.id}>
                          {fitting.name} - {fitting.part_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch_number">Batch Number</Label>
                    <Input
                      id="batch_number"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      placeholder="e.g., BT2024001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
                    <Input
                      id="manufacturing_date"
                      type="date"
                      value={formData.manufacturing_date}
                      onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone *</Label>
                    <Input
                      id="zone"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      placeholder="e.g., Northern"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="division">Division *</Label>
                    <Input
                      id="division"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      placeholder="e.g., Delhi"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Input
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="e.g., Delhi-Ambala"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="km_post">KM Post *</Label>
                    <Input
                      id="km_post"
                      value={formData.km_post}
                      onChange={(e) => setFormData({ ...formData, km_post: e.target.value })}
                      placeholder="e.g., 125.500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="track_number">Track Number</Label>
                    <Input
                      id="track_number"
                      value={formData.track_number}
                      onChange={(e) => setFormData({ ...formData, track_number: e.target.value })}
                      placeholder="e.g., UP/DN/1/2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installation_date">Installation Date</Label>
                  <Input
                    id="installation_date"
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_details">Location Details</Label>
                  <Textarea
                    id="location_details"
                    value={formData.location_details}
                    onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                    placeholder="Additional location information, landmarks, etc."
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate QR Code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
