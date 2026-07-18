import { Store } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Store className="h-6 w-6" />
          </div>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-red-600">Missing or invalid reset token.</p>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
