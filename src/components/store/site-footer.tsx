import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRight, FlaskConical, Mail, MessageCircle, Send, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LangToggle } from "@/components/i18n/lang-toggle";
import { ptOf, T } from "@/components/i18n/t";
import { cn } from "@/lib/utils";
import { site, type NavLink } from "@/lib/site";

const TRUST = [
  { icon: FlaskConical, label: "Janoshik third-party tested" },
  { icon: ShieldCheck, label: "UV authenticity mark" },
  { icon: Truck, label: "Tracked UK & EU dispatch" },
  { icon: Wallet, label: "25+ ways to pay" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      {/* trust strip */}
      <div className="border-b border-border">
        <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-3 py-5 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-[0.8rem] text-muted-foreground">
              <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
              <T>{label}</T>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm space-y-5">
          <Link href="/" aria-label="Alluvi home" className="inline-block text-foreground">
            <Logo className="h-10" />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <T>
              Alluvi Labs develops and evaluates premium peptides and supplements, produced exclusively for controlled research and development purposes.
            </T>
          </p>
          <ul className="space-y-2 text-sm">
            {[...new Set([site.contact.supportEmail, site.contact.researchEmail])].map((email) => (
              <li key={email}>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-foreground/85 hover:text-brand"
                >
                  <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                  {email}
                </a>
              </li>
            ))}
            <li>
              <a
                href={site.contact.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground/85 hover:text-brand"
              >
                <Send className="size-4 text-muted-foreground" aria-hidden="true" />
                Telegram {site.contact.telegramHandle}
                <span className="sr-only">
                  <T>(opens in a new tab)</T>
                </span>
              </a>
            </li>
            <li>
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground/85 hover:text-brand"
              >
                <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
                WhatsApp
                <span className="sr-only">
                  <T>(opens in a new tab)</T>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {site.footer.columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 text-xs font-bold tracking-[0.14em] text-foreground uppercase">
                <T>{col.title}</T>
              </h2>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <FooterLink link={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[0.7rem] font-semibold tracking-[0.08em] text-brand">
            <T>{site.footer.disclaimer}</T>
          </p>
          <p className="text-xs text-muted-foreground">
            <Copyright />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ link }: { link: NavLink }) {
  const cls =
    "inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
  if (link.langToggle) return <LangToggle className={cn(cls, "cursor-pointer")} />;
  if (link.external)
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        <T>{link.label}</T>
        <ArrowUpRight className="size-3 opacity-60" aria-hidden="true" />
        <span className="sr-only">
                  <T>(opens in a new tab)</T>
                </span>
      </a>
    );
  return (
    <Link href={link.href} className={cls}>
      <T>{link.label}</T>
    </Link>
  );
}

/** `new Date()` is not allowed in a prerendered shell (Cache Components), so the year is cached. */
async function Copyright() {
  "use cache";
  cacheLife("days");
  const year = String(new Date().getFullYear());
  return <T pt={ptOf(site.footer.copyright).replace("{year}", year)}>{site.footer.copyright.replace("{year}", year)}</T>;
}
