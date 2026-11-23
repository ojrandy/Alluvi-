import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MailWarning, Pencil } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import { OrderHistory } from "@/components/account/order-history";
import { ResendVerification } from "@/components/account/resend-verification";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countryName } from "@/lib/constants";
import { requireCustomer, type CurrentCustomer } from "@/server/customer-auth";
import { getCustomerOrders } from "@/server/queries/customer-orders";

export const metadata: Metadata = { title: "Orders" };

const NOTICES: Record<string, string> = {
  verified: "Your email is confirmed. Any earlier guest orders placed with it are now in your account.",
  password: "Your password has been updated. You've been signed out on other devices.",
};

export default function AccountPage(props: PageProps<"/account">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountOverview {...props} />
    </Suspense>
  );
}

async function AccountOverview({ searchParams }: PageProps<"/account">) {
  const customer = await requireCustomer("/account");
  const [orders, sp] = await Promise.all([getCustomerOrders(customer.id), searchParams]);
  const notice = typeof sp.updated === "string" ? NOTICES[sp.updated] : undefined;

  return (
    <div className="space-y-8">
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {!customer.emailVerified && (
        <div className="flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-3">
            <MailWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium">Confirm your email address</p>
              <p className="mt-1 text-muted-foreground">
                Confirm <span className="break-all text-foreground">{customer.email}</span> to see guest orders you placed with it before
                you had an account.
              </p>
            </div>
          </div>
          <ResendVerification />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <section aria-labelledby="orders-title">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="orders-title" className="text-h3">
              Hello, {customer.firstName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length === 1 ? "" : "s"}
            </p>
          </div>
          <OrderHistory orders={orders} />
        </section>
        <DetailsCard customer={customer} />
      </div>
    </div>
  );
}

function DetailsCard({ customer }: { customer: CurrentCustomer }) {
  const a = customer.defaultAddress;
  return (
    <aside aria-labelledby="details-title" className="self-start rounded-3xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="details-title" className="text-h3">Your details</h2>
        <Button asChild variant="ghost" size="icon-touch" className="hover:bg-white/[0.06]">
          <Link href="/account/details" aria-label="Edit your details">
            <Pencil className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Name</dt>
          <dd className="mt-0.5">{customer.firstName} {customer.lastName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-0.5 break-all">{customer.email}</dd>
        </div>
        {customer.phone && (
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-0.5">{customer.phone}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Default delivery address</dt>
          <dd className="mt-0.5 leading-relaxed">
            {a ? (
              <address className="not-italic">
                {[a.line1, a.line2, a.city, a.postcode, countryName(a.country)].filter(Boolean).map((l) => (
                  <span key={l} className="block">{l}</span>
                ))}
              </address>
            ) : (
              <Link href="/account/details" className="text-brand underline-offset-4 hover:underline">Add an address</Link>
            )}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function AccountSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10" aria-busy="true" aria-label="Loading your account">
      <div className="space-y-3">
        <Skeleton className="mb-4 h-7 w-48 rounded-lg" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );
}
