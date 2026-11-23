import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/login-form";
import { safeNextPath } from "@/lib/safe-redirect";
import { getCurrentCustomer } from "@/server/customer-auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Alluvi account to see your orders and check out faster.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to see your orders and check out faster."
      footer={
        <>
          <p>
            New to Alluvi?{" "}
            <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">Create an account</Link>
          </p>
          <p className="mt-2">
            Ordered as a guest?{" "}
            <Link href="/track-order" className="font-medium text-brand underline-offset-4 hover:underline">Track your order</Link>
          </p>
        </>
      }
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginGate {...props} />
      </Suspense>
    </AuthShell>
  );
}

/** Request-time: already signed in → straight on; otherwise the form, carrying a validated ?next=. */
async function LoginGate({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next, "/account");
  if (await getCurrentCustomer()) redirect(next);
  return <LoginForm next={next} />;
}
