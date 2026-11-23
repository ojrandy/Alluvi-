import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDetailsForm } from "@/components/account/account-details-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/server/customer-auth";

export const metadata: Metadata = { title: "Details & address" };

export default function AccountDetailsPage() {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
        <Details />
      </Suspense>
    </div>
  );
}

async function Details() {
  const c = await requireCustomer("/account/details");
  const a = c.defaultAddress;
  return (
    <AccountDetailsForm
      // After a save, revalidatePath re-renders this with the stored values; React's post-action
      // form reset then shows them (e.g. the normalised postcode). No remount, so the
      // "Saved" message survives.
      defaults={{
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone ?? "",
        line1: a?.line1 ?? "",
        line2: a?.line2 ?? "",
        city: a?.city ?? "",
        postcode: a?.postcode ?? "",
        country: a?.country ?? "GB",
      }}
    />
  );
}
