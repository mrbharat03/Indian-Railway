"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Search, Camera, MapPin, Calendar, User, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface QRCodeData {
  id: string
  qr_code: string
  batch_number: string
  manufacturing_date: string
  installation_date: string
  location_details: any
  zone: string
  division: string
  section: string
  km_post: string
  track_number: string
  status: string
  created_at: string
  track_fittings: {
    id: string
    name: string
    part_number: string
    specifications: any
    manufacturer: string
    material: string
    weight_kg: number
  }
  recent_inspections: Array<{
    id: string
    inspection_date: string
    condition_rating: number
    observations: string
    inspector: {
      name: string
    }
  }>
  recent_maintenance: Array<{
    id: string
    maintenance_date: string
    maintenance_type: string
    work_description: string
    technician: {
      name: string
    }
  }>
}

export default function ScanPage() {
  const [qrCode, setQrCode] = useState("")
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const searchQRCode = async () => {
    if (!qrCode.trim()) {
      setError("Please enter a QR code")
      return
    }

    setIsLoading(true)
    setError(null)
    setQrData(null)

    try {
      const supabase = createClient()

      // Fetch QR code data with related information
      const { data, error: fetchError } = await supabase
        .from("qr_codes")
        .select(
          `
          *,
          track_fittings (
            id,
            name,
            part_number,
            specifications,
            manufacturer,
            material,
            weight_kg
          ),
          recent_inspections:inspections (
            id,
            inspection_date,
            condition_rating,
            observations,
            inspector:profiles!inspections_inspector_id_fkey (
              name
            )
          ),
          recent_maintenance:maintenance_records (
            id,
            maintenance_date,
            maintenance_type,
            work_description,
            technician:profiles!maintenance_records_technician_id_fkey (
              name
            )
          )
        `,
        )
        .eq("qr_code", qrCode.trim())
        .order("inspection_date", { referencedTable: "recent_inspections", ascending: false })
        .order("maintenance_date", { referencedTable: "recent_maintenance", ascending: false })
        .limit(3, { referencedTable: "recent_inspections" })
        .limit(3, { referencedTable: "recent_maintenance" })
        .single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("QR code not found in the system")
        } else {
          throw fetchError
        }
        return
      }

      setQrData(data)

      // Log the scan activity
      await supabase.from("audit_logs").insert({
        qr_code_id: data.id,
        user_id: user?.id,
        action: "QR_SCAN",
        details: {
          scanned_at: new Date().toISOString(),
          scan_method: "manual_entry",
        },
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchQRCode()
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "maintenance":
        return "bg-yellow-500"
      case "inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getConditionColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold">QR Scanner</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>Enter QR code manually or use camera to scan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">QR Code</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-input"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter QR code (e.g., IR20241201123456789)"
                  className="flex-1"
                />
                <Button onClick={searchQRCode} disabled={isLoading} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Camera scan button - placeholder for future implementation */}
            <Button variant="outline" className="w-full bg-transparent" disabled>
              <Camera className="h-4 w-4 mr-2" />
              Scan with Camera (Coming Soon)
            </Button>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Details */}
        {qrData && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{qrData.track_fittings.name}</CardTitle>
                  <Badge className={getStatusColor(qrData.status)}>{qrData.status}</Badge>
                </div>
                <CardDescription>Part No: {qrData.track_fittings.part_number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">QR Code</p>
                    <p className="font-mono">{qrData.qr_code}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Batch Number</p>
                    <p>{qrData.batch_number || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Manufacturer</p>
                    <p>{qrData.track_fittings.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Material</p>
                    <p>{qrData.track_fittings.material}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {qrData.zone} | {qrData.division} | {qrData.section}
                    </p>
                    <p className="text-muted-foreground">
                      KM {qrData.km_post} | Track {qrData.track_number}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="specifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="specifications">Specs</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value="specifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Technical Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p>{qrData.track_fittings.weight_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Manufacturing Date</p>
                        <p>{formatDate(qrData.manufacturing_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Installation Date</p>
                        <p>{formatDate(qrData.installation_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Registered</p>
                        <p>{formatDate(qrData.created_at)}</p>
                      </div>
                    </div>

                    {qrData.track_fittings.specifications && (
                      <div>
                        <p className="text-muted-foreground mb-2">Additional Specifications</p>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(qrData.track_fittings.specifications, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inspections" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Inspections</h3>
                  <Link href={`/inspections/new?qr_id=${qrData.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Inspection
                    </Button>
                  </Link>
                </div>

                {qrData.recent_inspections && qrData.recent_inspections.length > 0 ? (
                  <div className="space-y-3">
                    {qrData.recent_inspections.map((inspection) => (
                      <Card key={inspection.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(inspection.inspection_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Rating:</span>
                              <span className={`font-medium ${getConditionColor(inspection.condition_rating)}`}>
                                {inspection.condition_rating}/5
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{inspection.inspector.name}</span>
                          </div>
                          {inspection.observations && (
                            <p className="text-sm text-muted-foreground">{inspection.observations}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No inspections recorded yet</p>
                      <Link href={`/inspections/new?qr_id=${qrData.id}`}>
                        <Button className="mt-2" size="sm">
                          Add First Inspection
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Maintenance</h3>
                  <Link href={`/maintenance/new?qr_id=${qrData.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Maintenance
                    </Button>
                  </Link>
                </div>

                {qrData.recent_maintenance && qrData.recent_maintenance.length > 0 ? (
                  <div className="space-y-3">
                    {qrData.recent_maintenance.map((maintenance) => (
                      <Card key={maintenance.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(maintenance.maintenance_date)}</span>
                            </div>
                            <Badge variant="outline">{maintenance.maintenance_type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{maintenance.technician.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{maintenance.work_description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No maintenance records yet</p>
                      <Link href={`/maintenance/new?qr_id=${qrData.id}`}>
                        <Button className="mt-2" size="sm">
                          Add First Record
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
