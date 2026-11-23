import "server-only";
import { accountExistsEmail, resetPasswordEmail, verifyEmailEmail } from "@/emails/account";
import { siteUrl } from "@/lib/site";
import { TOKEN_TTL_MINUTES } from "./customer-tokens";
import { sendMail } from "./mail";

/**
 * Best-effort account emails, called from `after()` so the response time never depends on SMTP
 * (and therefore never hints at whether an account exists). Logs carry an error code only.
 */
type Job =
  | { kind: "verify"; to: string; firstName: string; token: string }
  | { kind: "reset"; to: string; firstName: string; token: string }
  | { kind: "exists"; to: string; firstName: string };

export async function sendAccountEmail(job: Job): Promise<void> {
  try {
    const msg =
      job.kind === "verify"
        ? verifyEmailEmail({ firstName: job.firstName, url: `${siteUrl}/verify-email?token=${job.token}`, ttlMinutes: TOKEN_TTL_MINUTES })
        : job.kind === "reset"
          ? resetPasswordEmail({ firstName: job.firstName, url: `${siteUrl}/reset-password?token=${job.token}`, ttlMinutes: TOKEN_TTL_MINUTES })
          : accountExistsEmail({ firstName: job.firstName, loginUrl: `${siteUrl}/login`, resetUrl: `${siteUrl}/forgot-password` });
    await sendMail({ to: job.to, ...msg });
  } catch (err) {
    const e = err as { code?: unknown; responseCode?: unknown };
    const code = typeof e?.code === "string" ? e.code : typeof e?.responseCode === "number" ? `SMTP_${e.responseCode}` : "UNKNOWN";
    console.error(`[account-email] ${job.kind} failed: ${code}`);
  }
}
