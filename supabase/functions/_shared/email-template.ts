const LOGO_URL = "https://orthohouseuk.com/assets/brand/logo-svg-png.png";
const BRAND_BLUE = "#1e5a8e";
const WEBSITE_URL = "https://orthohouseuk.com";

export type PortfolioBrochure = {
  displayName: string;
  downloadUrl?: string;
};

export type PortfolioEmailOptions = {
  partnerName: string;
  brochures: PortfolioBrochure[];
  attached: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderBrochureList(brochures: PortfolioBrochure[], attached: boolean): string {
  const items = brochures
    .map((brochure) => {
      const name = escapeHtml(brochure.displayName);
      if (attached || !brochure.downloadUrl) {
        return `<li style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.5;">${name}</li>`;
      }
      const url = escapeHtml(brochure.downloadUrl);
      return `<li style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.5;">
        <a href="${url}" style="color:${BRAND_BLUE};text-decoration:none;font-weight:600;">${name}</a>
      </li>`;
    })
    .join("");

  return `<ul style="margin:16px 0 0 0;padding:0 0 0 20px;">${items}</ul>`;
}

export function buildPortfolioEmailSubject(partnerName: string): string {
  return `Your ${partnerName} portfolio from ORTHOHOUSE UK`;
}

export function buildPortfolioEmailHtml(options: PortfolioEmailOptions): string {
  const { partnerName, brochures, attached } = options;
  const safePartner = escapeHtml(partnerName);
  const deliveryNote = attached
    ? "The brochures listed below are attached to this email as PDF files."
    : "The brochures listed below are available via secure download links (valid for 7 days).";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${safePartner} portfolio</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:${BRAND_BLUE};padding:28px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="ORTHOHOUSE UK" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND_BLUE};">
                Portfolio request
              </p>
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:#0f172a;">
                Your ${safePartner} portfolio
              </h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#475569;">
                Thank you for your interest in ORTHOHOUSE UK. As requested, here is the ${safePartner} product portfolio.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
                ${deliveryNote}
              </p>
              ${renderBrochureList(brochures, attached)}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:20px;">
                    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#64748b;">
                      ORTHOHOUSE UK distributes CE-marked and MHRA-compliant medical devices. Products must be used by qualified healthcare professionals in accordance with applicable regulations and the manufacturer's instructions for use.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                      <a href="${WEBSITE_URL}" style="color:${BRAND_BLUE};text-decoration:none;font-weight:600;">orthohouseuk.com</a>
                      &nbsp;·&nbsp;
                      <a href="mailto:info@ortho-house.com" style="color:${BRAND_BLUE};text-decoration:none;">info@ortho-house.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
