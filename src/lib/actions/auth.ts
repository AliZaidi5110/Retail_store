"use server";

import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signIn, signOut, auth } from "@/lib/auth";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = {
  success: boolean;
  message?: string;
  token?: string;
};

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    // Ensure DB is reachable before auth (clearer error on Vercel misconfig)
    await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });
  } catch {
    return {
      success: false,
      message:
        "Database is not connected. Add DATABASE_URL in Vercel and run the seed script.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, message: "Invalid email or password" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Always return success to avoid email enumeration
  if (!user) {
    return {
      success: true,
      message: "If that email exists, a reset link has been prepared.",
    };
  }

  const token = randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry },
  });

  // In production, email this link. For local/dev we return the token path.
  return {
    success: true,
    message: "Reset token generated. Use the link below (dev mode).",
    token,
  };
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: parsed.data.token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return { success: false, message: "Reset link is invalid or expired" };
  }

  const password = await hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { success: true, message: "Password updated. You can sign in now." };
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, message: "User not found" };

  const valid = await compare(parsed.data.currentPassword, user.password);
  if (!valid) return { success: false, message: "Current password is incorrect" };

  const password = await hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password },
  });

  revalidatePath("/settings");
  return { success: true, message: "Password changed successfully" };
}
