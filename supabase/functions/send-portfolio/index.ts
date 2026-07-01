import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { buildPortfolioEmailHtml } from "../_shared/portfolio-email.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ATTACHMENT_SIZE_LIMIT_BYTES = 15 * 1024 * 1024;
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 7;
const BUCKET = "partner-portfolios";

interface PortfolioFileRow {
  storage_path: string;
  display_name: string;
  display_order: number;
}

interface DownloadedFile {
  displayName: string;
  storagePath: string;
  bytes: Uint8Array;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const fromEmail = Deno.env.get("PORTFOLIO_FROM_EMAIL") ?? "onboarding@resend.dev";
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://ortho-house-uk.vercel.app";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(req, { error: "Server configuration error" }, 500);
  }

  let body: { partner_id?: number; email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { code: "invalid_email", message: "Invalid request body" }, 400);
  }

  const partnerId = Number(body.partner_id);
  const email = (body.email ?? "").trim().toLowerCase();

  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return jsonResponse(req, { code: "invalid_partner", message: "Invalid partner" }, 400);
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return jsonResponse(req, { code: "invalid_email", message: "Invalid email address" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentCount, error: rateError } = await supabase
    .from("portfolio_requests")
    .select("portfolio_request_id", { count: "exact", head: true })
    .eq("visitor_email", email)
    .gte("created_at", since)
    .neq("status", "rate_limited");

  if (rateError) {
    console.error("Rate limit check failed:", rateError.message);
    return jsonResponse(req, { error: "Unable to process request" }, 500);
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    await supabase.from("portfolio_requests").insert({
      partner_id: partnerId,
      visitor_email: email,
      status: "rate_limited",
      error_message: "Exceeded hourly limit",
    });
    return jsonResponse(
      req,
      { code: "rate_limited", message: "Too many requests. Please try again in an hour." },
      429,
    );
  }

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("partner_id, partner_name, is_active")
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (partnerError || !partner || !partner.is_active) {
    return jsonResponse(req, { code: "invalid_partner", message: "Partner not found" }, 404);
  }

  const { data: files, error: filesError } = await supabase
    .from("partner_portfolio_files")
    .select("storage_path, display_name, display_order")
    .eq("partner_id", partnerId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (filesError) {
    console.error("Portfolio files query failed:", filesError.message);
    return jsonResponse(req, { error: "Unable to load portfolio" }, 500);
  }

  const portfolioFiles = (files ?? []) as PortfolioFileRow[];
  if (portfolioFiles.length === 0) {
    await supabase.from("portfolio_requests").insert({
      partner_id: partnerId,
      visitor_email: email,
      status: "failed",
      error_message: "No portfolio files configured",
    });
    return jsonResponse(
      req,
      { code: "no_portfolio", message: "Portfolio not available for this partner yet." },
      404,
    );
  }

  const downloaded: DownloadedFile[] = [];
  for (const file of portfolioFiles) {
    const { data, error } = await supabase.storage.from(BUCKET).download(file.storage_path);
    if (error || !data) {
      console.error(`Download failed for ${file.storage_path}:`, error?.message);
      await supabase.from("portfolio_requests").insert({
        partner_id: partnerId,
        visitor_email: email,
        status: "failed",
        error_message: `Missing file: ${file.storage_path}`,
      });
      return jsonResponse(req, { error: "Portfolio files unavailable" }, 500);
    }
    downloaded.push({
      displayName: file.display_name,
      storagePath: file.storage_path,
      bytes: new Uint8Array(await data.arrayBuffer()),
    });
  }

  const totalBytes = downloaded.reduce((sum, file) => sum + file.bytes.byteLength, 0);
  const useAttachments = totalBytes <= ATTACHMENT_SIZE_LIMIT_BYTES;
  const brochureNames = downloaded.map((file) => file.displayName);
  const partnerName = partner.partner_name?.trim() || "Partner";

  let downloadLinks: Array<{ name: string; url: string }> | undefined;
  if (!useAttachments) {
    downloadLinks = [];
    for (const file of downloaded) {
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(file.storagePath, SIGNED_URL_EXPIRY_SECONDS);
      if (signError || !signed?.signedUrl) {
        console.error(`Signed URL failed for ${file.storagePath}:`, signError?.message);
        await supabase.from("portfolio_requests").insert({
          partner_id: partnerId,
          visitor_email: email,
          status: "failed",
          error_message: `Signed URL failed: ${file.storagePath}`,
        });
        return jsonResponse(req, { error: "Unable to prepare portfolio links" }, 500);
      }
      downloadLinks.push({ name: file.displayName, url: signed.signedUrl });
    }
  }

  if (!resendApiKey) {
    await supabase.from("portfolio_requests").insert({
      partner_id: partnerId,
      visitor_email: email,
      status: "failed",
      error_message: "RESEND_API_KEY not configured",
    });
    return jsonResponse(req, { error: "Email service not configured" }, 503);
  }

  const html = buildPortfolioEmailHtml({
    partnerName,
    brochureNames,
    downloadLinks,
    siteUrl,
  });

  const attachments = useAttachments
    ? downloaded.map((file) => ({
        filename: `${sanitizeFilename(file.displayName)}.pdf`,
        content: uint8ToBase64(file.bytes),
      }))
    : undefined;

  const resendPayload: Record<string, unknown> = {
    from: `OrthoHouse UK <${fromEmail}>`,
    to: [email],
    subject: `Your ${partnerName} portfolio from OrthoHouse UK`,
    html,
  };
  if (attachments && attachments.length > 0) {
    resendPayload.attachments = attachments;
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resendPayload),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error("Resend API error:", resendResponse.status, errorText);
    await supabase.from("portfolio_requests").insert({
      partner_id: partnerId,
      visitor_email: email,
      status: "failed",
      error_message: `Resend ${resendResponse.status}: ${errorText.slice(0, 500)}`,
    });
    return jsonResponse(req, { error: "Unable to send email" }, 502);
  }

  await supabase.from("portfolio_requests").insert({
    partner_id: partnerId,
    visitor_email: email,
    status: "sent",
  });

  return jsonResponse(req, { success: true });
});

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "").trim() || "portfolio";
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
