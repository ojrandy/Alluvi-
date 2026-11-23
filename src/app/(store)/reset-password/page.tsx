import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthShell } from "@/components/account/auth-shell";
import { DeadLink, ResetPasswordForm } from "@/components/account/recovery-forms";
import { isCustomerTokenUsable } from "@/server/customer-tokens";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  // The token is in the URL: never send it to other sites in the Referer header.
  referrer: "no-referrer",
};

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <AuthShell title="Choose a new password" description="Pick something you don't use on any other site.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetGate {...props} />
      </Suspense>
    </AuthShell>
  );
}

/** Read-only token check so an expired link says so before the customer types anything. */
async function ResetGate({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !(await isCustomerTokenUsable(token, "reset_password"))) return <DeadLink kind="reset" />;
  return <ResetPasswordForm token={token} />;
}
