const DEFAULT_SITE_URL = "https://ortho-house-uk.vercel.app";
const BRAND_BLUE = "#1e5a8e";

export interface PortfolioEmailOptions {
  partnerName: string;
  brochureNames: string[];
  downloadLinks?: Array<{ name: string; url: string }>;
  siteUrl?: string;
}

export function buildPortfolioEmailHtml(options: PortfolioEmailOptions): string {
  const { partnerName, brochureNames, downloadLinks } = options;
  const siteUrl = (options.siteUrl ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const logoUrl = `${siteUrl}/assets/brand/logo-svg-png.png`;
  const siteHost = new URL(siteUrl).host;
  const brochureList = brochureNames
    .map((name) => `<li style="margin:0 0 8px;color:#334155;">${escapeHtml(name)}</li>`)
    .join("");

  const downloadSection =
    downloadLinks && downloadLinks.length > 0
      ? `
        <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6;">
          Your portfolio files are available via secure download links (valid for 7 days):
        </p>
        <ul style="margin:0 0 20px;padding-left:20px;">
          ${downloadLinks
            .map(
              (link) =>
                `<li style="margin:0 0 10px;"><a href="${escapeHtml(link.url)}" style="color:${BRAND_BLUE};text-decoration:underline;">${escapeHtml(link.name)}</a></li>`,
            )
            .join("")}
        </ul>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your ${escapeHtml(partnerName)} portfolio from ORTHOHOUSE UK</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:${BRAND_BLUE};padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="ORTHOHOUSE UK" width="180" style="display:block;margin:0 auto 12px;max-width:180px;height:auto;">
              <p style="margin:0;color:#ffffff;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">Portfolio delivery</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">
                Your ${escapeHtml(partnerName)} portfolio
              </h1>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Thank you for your interest in ORTHOHOUSE UK. Please find the requested partner materials below.
              </p>
              <p style="margin:0 0 8px;color:#0f172a;font-size:15px;font-weight:bold;">Included brochures:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">
                ${brochureList}
              </ul>
              ${downloadSection}
              <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.6;">
                ORTHOHOUSE UK is an MHRA-registered distributor and UK Responsible Person for leading orthopaedic manufacturers.
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                <a href="${siteUrl}" style="color:${BRAND_BLUE};text-decoration:none;">${escapeHtml(siteHost)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
