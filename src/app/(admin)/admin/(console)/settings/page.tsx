import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForms } from "@/components/admin/settings/settings-forms";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { londonDayKey } from "@/lib/london-day";
import { shippingRowFromStored } from "@/lib/validators/admin-settings";
import { requireAdmin } from "@/server/auth";
import { getStoreSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Settings" };

/** /admin/settings (PRD FR-16): payment methods, shipping, free-shipping promo, notification email. */
export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="Settings" description="Payment details, shipping rates, promotions and order notifications." />
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  await requireAdmin();
  const s = await getStoreSettings();
  const promo = s.freeShippingPromo;

  return (
    <SettingsForms
      paymentMethods={s.paymentMethods.map((m) => ({ key: m.key, enabled: m.enabled, template: m.template }))}
      shipping={s.shippingOptions.map(shippingRowFromStored)}
      promo={
        promo
          ? { enabled: promo.enabled !== false, label: promo.label, startDay: dayOf(promo.startsAt), endDay: dayOf(promo.endsAt) }
          : { enabled: false, label: "Free shipping", startDay: "", endDay: "" }
      }
      notifyEmail={s.notifyEmail ?? ""}
      envNotifyFallback={!s.notifyEmail && !!process.env.ORDER_NOTIFY_EMAIL}
    />
  );
}

const dayOf = (iso: string) => (Number.isNaN(Date.parse(iso)) ? "" : londonDayKey(new Date(iso)));

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {[18, 26, 14, 10].map((h, i) => (
        <Skeleton key={i} className="w-full rounded-[1.25rem]" style={{ height: `${h}rem` }} />
      ))}
    </div>
  );
}
