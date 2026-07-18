"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {state?.message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}{" "}
          {state.success && (
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>
          )}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending || !token}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
