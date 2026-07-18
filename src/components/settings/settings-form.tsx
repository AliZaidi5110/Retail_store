"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { updateSettings } from "@/lib/actions/settings";
import { changePasswordAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function SettingsForm({
  initial,
}: {
  initial: SettingsInput;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pwdPending, setPwdPending] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<ActionResult | null>(null);

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: SettingsInput) {
    setPending(true);
    try {
      const result = await updateSettings(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdPending(true);
    setPwdMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      const result = await changePasswordAction(null, fd);
      setPwdMsg(result);
      if (result.success) {
        toast.success(result.message);
        e.currentTarget.reset();
      }
    } finally {
      setPwdPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" {...form.register("storeName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...form.register("currency")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax / GST rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...form.register("taxRate")}
            />
          </div>
          <div className="flex items-center gap-2 pt-7">
            <Checkbox
              id="gstEnabled"
              checked={form.watch("gstEnabled")}
              onCheckedChange={(v) => form.setValue("gstEnabled", Boolean(v))}
            />
            <Label htmlFor="gstEnabled" className="cursor-pointer">
              GST enabled
            </Label>
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save settings"}
        </Button>
      </form>

      <Separator />

      <form onSubmit={onChangePassword} className="max-w-md space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Change password</h3>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        {pwdMsg && (
          <p
            className={`text-sm ${
              pwdMsg.success ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {pwdMsg.message}
          </p>
        )}
        <Button type="submit" variant="secondary" disabled={pwdPending}>
          {pwdPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
