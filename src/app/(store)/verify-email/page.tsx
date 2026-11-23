import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthShell } from "@/components/account/auth-shell";
import { DeadLink, VerifyEmailForm } from "@/components/account/recovery-forms";
import { isCustomerTokenUsable } from "@/server/customer-tokens";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VerifyEmailPage(props: PageProps<"/verify-email">) {
  return (
    <AuthShell
      title="Confirm your email"
      description="One click and your account is ready. Earlier guest orders placed with this email will appear in your account."
    >
      <Suspense fallback={<AuthFormSkeleton fields={0} />}>
        <VerifyGate {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function VerifyGate({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !(await isCustomerTokenUsable(token, "verify_email"))) return <DeadLink kind="verify" />;
  return <VerifyEmailForm token={token} />;
}
