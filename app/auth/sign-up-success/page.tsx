import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Account Created Successfully!</CardTitle>
            <CardDescription>Please check your email to verify your account</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                We've sent a verification email to your registered email address. Please click the verification link to
                activate your account.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>After verification, you'll be able to:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Access the railway QR management system</li>
                <li>Scan and manage QR codes</li>
                <li>Record inspections and maintenance</li>
                <li>View analytics and reports (based on your role)</li>
              </ul>
            </div>

            <div className="pt-4">
              <Link href="/auth/login">
                <Button className="w-full">Return to Login</Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
