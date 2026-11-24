import type { Metadata } from "next";
import { FileText, Mail, MessageCircle, Send } from "lucide-react";
import { T } from "@/components/i18n/t";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Alluvi by email, Telegram or WhatsApp, or request a certificate of analysis.",
  alternates: { canonical: "/contact" },
};

/**
 * Official contact channels (content/site.json). Also the destination for certificate-of-analysis
 * requests while our own Janoshik verification links for this domain are pending.
 */
export default function ContactPage() {
  const email = site.contact.supportEmail;
  const coaMailto = `mailto:${email}?subject=${encodeURIComponent("Certificate of Analysis request")}`;

  return (
    <section className="container-page grid gap-10 pt-12 pb-20 md:pt-20 md:pb-28 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <div>
        <p className="eyebrow">
          <T>Contact</T>
        </p>
        <h1 className="text-h1 mt-4 max-w-2xl text-balance">
          <T>Get in touch with Alluvi</T>
        </h1>
        <p className="text-lead mt-5 max-w-xl">
          <T>{"Our only official channels are listed here. Please don't make payments to anyone claiming to be Alluvi elsewhere."}</T>
        </p>

        <div id="certificates" className="mt-10 max-w-xl scroll-mt-28 rounded-3xl border border-border bg-card p-6">
          <p className="inline-flex items-center gap-2 font-semibold">
            <FileText className="size-4 text-brand" aria-hidden="true" />
            <T>Certificates of analysis</T>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <T
              pt={`Os links de verificação independente dos lotes ${site.canonicalDomain} estão sendo emitidos pela Janoshik. Até serem publicados, fale conosco informando o produto e o número do lote e enviaremos o certificado.`}
            >{`Independent verification links for ${site.canonicalDomain} batches are being issued by Janoshik. Until they are published, contact us with the product and batch number and we'll send you the certificate.`}</T>
          </p>
          <Button asChild variant="brand" size="lg" className="mt-5">
            <a href={coaMailto}>
              <T>Request a certificate</T>
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <p className="font-semibold">
          <T>Official channels</T>
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button asChild variant="brand" size="xl">
            <a href={`mailto:${email}`}>
              <Mail data-icon="inline-start" aria-hidden="true" />
              {email}
            </a>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href={site.contact.telegramUrl} target="_blank" rel="noopener noreferrer">
              <Send data-icon="inline-start" aria-hidden="true" />
              Telegram {site.contact.telegramHandle}
              <span className="sr-only">
                {" "}
                <T>(opens in a new tab)</T>
              </span>
            </a>
          </Button>
          <Button asChild variant="glass" size="xl">
            <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle data-icon="inline-start" aria-hidden="true" />
              WhatsApp
              <span className="sr-only">
                {" "}
                <T>(opens in a new tab)</T>
              </span>
            </a>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          <T>{site.productDisclaimer}</T>
        </p>
      </div>
    </section>
  );
}
