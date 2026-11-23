import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthShell } from "@/components/account/auth-shell";
import { SignupForm } from "@/components/account/signup-form";
import { getCurrentCustomer } from "@/server/customer-auth";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an Alluvi account to keep your order history in one place and check out faster.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Optional. Keep your order history in one place and check out faster. Guest checkout works just the same."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">Sign in</Link>
        </p>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <SignupGate />
      </Suspense>
    </AuthShell>
  );
}

async function SignupGate() {
  if (await getCurrentCustomer()) redirect("/account");
  return <SignupForm />;
}
