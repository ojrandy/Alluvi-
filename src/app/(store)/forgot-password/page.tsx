import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { ForgotPasswordForm } from "@/components/account/recovery-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
};

/** Fully static: no request data until the form is submitted. */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email you signed up with and we'll send you a link to choose a new one."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Sign in</Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
