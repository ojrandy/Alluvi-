import { brandColor, emailShell, esc, mutedColor, p } from "./layout";

/** Transactional account emails. Plain links, no tracking, and the link's expiry is always stated. */

type Built = { subject: string; html: string; text: string };

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="border-radius:999px;background:${brandColor};">
<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;border-radius:999px;">${esc(label)}</a>
</td></tr></table>`;

const fallbackLink = (href: string) =>
  `<p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${mutedColor};">If the button doesn't work, paste this link into your browser:<br><a href="${esc(href)}" style="color:${brandColor};word-break:break-all;">${esc(href)}</a></p>`;

const ignoreLine = (what: string) =>
  `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${mutedColor};">${esc(what)}</p>`;

export function verifyEmailEmail(d: { firstName: string; url: string; ttlMinutes: number }): Built {
  const heading = "Confirm your email";
  return {
    subject: "Confirm your Alluvi account",
    html: emailShell({
      preheader: "Confirm your email to finish creating your Alluvi account.",
      heading,
      body: [
        p(`Hi ${esc(d.firstName)},`),
        p("Thanks for creating an Alluvi account. Confirm your email address to activate it. Any earlier orders you placed as a guest with this email will then appear in your account."),
        button(d.url, "Confirm my email"),
        fallbackLink(d.url),
        ignoreLine(`This link expires in ${d.ttlMinutes} minutes and can be used once. If you didn't create an account, you can ignore this email.`),
      ].join(""),
    }),
    text: [
      `Hi ${d.firstName},`,
      "",
      "Thanks for creating an Alluvi account. Confirm your email address to activate it:",
      d.url,
      "",
      `This link expires in ${d.ttlMinutes} minutes and can be used once. If you didn't create an account, you can ignore this email.`,
    ].join("\n"),
  };
}

export function resetPasswordEmail(d: { firstName: string; url: string; ttlMinutes: number }): Built {
  const heading = "Reset your password";
  return {
    subject: "Reset your Alluvi password",
    html: emailShell({
      preheader: "Use this link to choose a new password for your Alluvi account.",
      heading,
      body: [
        p(`Hi ${esc(d.firstName)},`),
        p("We received a request to reset the password for your Alluvi account. Choose a new password using the button below."),
        button(d.url, "Choose a new password"),
        fallbackLink(d.url),
        ignoreLine(`This link expires in ${d.ttlMinutes} minutes and can be used once. If you didn't ask for this, you can ignore this email: your password won't change.`),
      ].join(""),
    }),
    text: [
      `Hi ${d.firstName},`,
      "",
      "We received a request to reset the password for your Alluvi account. Choose a new password here:",
      d.url,
      "",
      `This link expires in ${d.ttlMinutes} minutes and can be used once. If you didn't ask for this, ignore this email: your password won't change.`,
    ].join("\n"),
  };
}

/** Sent when someone signs up with an email that already has an account (no enumeration on the site). */
export function accountExistsEmail(d: { firstName: string; loginUrl: string; resetUrl: string }): Built {
  const heading = "You already have an account";
  return {
    subject: "Your Alluvi account",
    html: emailShell({
      preheader: "Someone tried to create an Alluvi account with this email.",
      heading,
      body: [
        p(`Hi ${esc(d.firstName)},`),
        p("Someone (hopefully you) tried to create an Alluvi account with this email address, but you already have one. You can sign in with your existing password."),
        button(d.loginUrl, "Sign in"),
        p(`Forgotten your password? <a href="${esc(d.resetUrl)}" style="color:${brandColor};">Reset it here</a>.`),
        ignoreLine("If this wasn't you, no action is needed. Your account hasn't changed."),
      ].join(""),
    }),
    text: [
      `Hi ${d.firstName},`,
      "",
      "Someone (hopefully you) tried to create an Alluvi account with this email address, but you already have one.",
      `Sign in: ${d.loginUrl}`,
      `Forgotten your password? ${d.resetUrl}`,
      "",
      "If this wasn't you, no action is needed. Your account hasn't changed.",
    ].join("\n"),
  };
}
