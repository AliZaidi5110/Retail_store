"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="owner@store.pk"
        />
      </div>
      {state?.message && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          <p>{state.message}</p>
          {state.success && state.token && (
            <Link
              href={`/reset-password?token=${state.token}`}
              className="mt-2 inline-block font-medium underline"
            >
              Continue to reset password
            </Link>
          )}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-teal-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
