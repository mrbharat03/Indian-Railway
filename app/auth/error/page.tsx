import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "access_denied":
        return "Access was denied. You may not have permission to access this resource."
      case "server_error":
        return "A server error occurred. Please try again later."
      case "temporarily_unavailable":
        return "The service is temporarily unavailable. Please try again later."
      default:
        return "An authentication error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">{getErrorMessage(params?.error || "unknown")}</p>
            </div>

            {params?.error && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Error Code: {params.error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">Try Again</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                If the problem persists, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
