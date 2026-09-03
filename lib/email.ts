import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.ALERT_FROM_EMAIL || "alerts@yourdomain.com";

function wrapper(title: string, bodyHtml: string) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 12px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:13px;color:#6b7280;">— Website Watchdog</p>
  </div>`;
}

export async function sendDowntimeAlert(to: string, siteUrl: string, httpCode: number | null) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🔴 ${siteUrl} appears to be down`,
    html: wrapper(
      "Site down",
      `<p><strong>${siteUrl}</strong> did not respond successfully on the last check${
        httpCode ? ` (HTTP ${httpCode})` : ""
      }.</p><p>We'll keep checking and email you again once it's back up.</p>`
    ),
  });
}

export async function sendRecoveryAlert(to: string, siteUrl: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🟢 ${siteUrl} is back up`,
    html: wrapper(
      "Site recovered",
      `<p><strong>${siteUrl}</strong> is responding normally again.</p>`
    ),
  });
}

export async function sendSslExpiryAlert(to: string, siteUrl: string, expiresAt: Date, daysLeft: number) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ SSL certificate for ${siteUrl} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    html: wrapper(
      "SSL certificate expiring soon",
      `<p>The SSL certificate for <strong>${siteUrl}</strong> expires on <strong>${expiresAt.toDateString()}</strong> (${daysLeft} day${
        daysLeft === 1 ? "" : "s"
      } from now).</p><p>Renew it before then to avoid the site showing a security warning.</p>`
    ),
  });
}

export async function sendBrokenLinksAlert(to: string, siteUrl: string, brokenCount: number) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🔗 ${brokenCount} broken link${brokenCount === 1 ? "" : "s"} found on ${siteUrl}`,
    html: wrapper(
      "Broken links found",
      `<p>This week's scan found <strong>${brokenCount}</strong> broken link${
        brokenCount === 1 ? "" : "s"
      } on <strong>${siteUrl}</strong>.</p><p>Sign in to your dashboard to see the full list.</p>`
    ),
  });
}
