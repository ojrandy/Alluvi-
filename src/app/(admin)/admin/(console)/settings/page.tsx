import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForms } from "@/components/admin/settings/settings-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { londonDayKey } from "@/lib/london-day";
import { shippingRowFromStored } from "@/lib/validators/admin-settings";
import { requireAdmin } from "@/server/auth";
import { getStoreSettings, usableBankDetails } from "@/server/settings";

export const metadata: Metadata = { title: "Settings" };

/** /admin/settings (PRD FR-16): bank transfer, shipping, free-shipping promo, notification email. */
export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  await requireAdmin();
  const s = await getStoreSettings();
  const b = s.bankDetails;
  const promo = s.freeShippingPromo;

  return (
    <SettingsForms
      bankIsPlaceholder={!!b && !usableBankDetails(b)}
      bank={{
        accountName: b?.accountName ?? "",
        bankName: b?.bankName ?? "",
        sortCode: b?.sortCode ?? "",
        accountNumber: b?.accountNumber ?? "",
        iban: b?.iban ?? "",
        instructions: b?.instructions ?? "",
      }}
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
        <Skeleton key={i} className="w-full rounded-2xl" style={{ height: `${h}rem` }} />
      ))}
    </div>
  );
}
