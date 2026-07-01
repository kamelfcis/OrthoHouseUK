#!/usr/bin/env python3
"""
Upload partner portfolio PDFs from Portofolio/ to Supabase Storage and upsert metadata.

Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.
For DDL, also set SUPABASE_DB_PASSWORD (database password from Supabase dashboard).

Usage:
  python scripts/upload_partner_portfolios.py
  python scripts/upload_partner_portfolios.py --dry-run
  python scripts/upload_partner_portfolios.py --upload-only
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "Portofolio"
MIGRATION_PATH = ROOT / "supabase" / "migrations" / "20250701120000_create_partner_portfolio.sql"
BUCKET = "partner-portfolios"
UK_BRANCH_CODE = "UK"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# partner_id -> list of (local_filename, display_name, display_order)
PORTFOLIO_MAPPINGS: dict[int, list[tuple[str, str, int]]] = {
    12: [("EincoBio Solution.pdf", "EincoBio Solution", 1)],
    20: [
        ("Astrolabe Prochure Full Set.pdf", "Astrolabe Prochure Full Set", 1),
        ("Astrolabe Surgical-Technique.pdf", "Astrolabe Surgical-Technique", 2),
    ],
    10: [
        ("Permedica.pdf", "Permedica", 1),
        ("Permedica Products.pdf", "Permedica Products", 2),
        ("Permedica Solution.pdf", "Permedica Solution", 3),
    ],
    23: [
        (
            "Orthosintex Episcan Foot and Ankle 2025.pdf",
            "Orthosintex Episcan Foot and Ankle 2025",
            1,
        ),
    ],
}


def load_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def headers(prefer: str = "return=representation,resolution=merge-duplicates") -> dict[str, str]:
    if not SERVICE_KEY:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required.")
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def table_exists() -> bool:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/partner_portfolio_files?select=portfolio_file_id&limit=1",
        headers=headers("return=minimal"),
        timeout=30,
    )
    if resp.status_code == 200:
        return True
    if resp.status_code == 404:
        return False
    raise RuntimeError(
        f"Unexpected status checking partner_portfolio_files ({resp.status_code}): {resp.text[:300]}"
    )


def apply_migration_with_psycopg() -> None:
    password = os.environ.get("SUPABASE_DB_PASSWORD")
    if not password:
        raise RuntimeError("SUPABASE_DB_PASSWORD is not set.")

    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("Install psycopg2-binary to apply migrations from this script.") from exc

    project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]
    host = os.environ.get("SUPABASE_DB_HOST", "aws-0-eu-central-1.pooler.supabase.com")
    port = int(os.environ.get("SUPABASE_DB_PORT", "6543"))
    user = os.environ.get("SUPABASE_DB_USER", f"postgres.{project_ref}")
    database = os.environ.get("SUPABASE_DB_NAME", "postgres")

    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=database,
        sslmode="require",
    )
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
    finally:
        conn.close()


def fetch_partner_codes(partner_ids: list[int]) -> dict[int, str]:
    ids = ",".join(str(i) for i in partner_ids)
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/partners?partner_id=in.({ids})&select=partner_id,partner_code",
        headers=headers("return=representation"),
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to fetch partners ({resp.status_code}): {resp.text[:300]}")
    return {row["partner_id"]: row["partner_code"] for row in resp.json()}


def upload_pdf(storage_path: str, local_path: Path) -> None:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    with local_path.open("rb") as fh:
        resp = requests.post(
            url,
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/pdf",
                "x-upsert": "true",
            },
            data=fh.read(),
            timeout=180,
        )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Upload {storage_path} -> {resp.status_code}: {resp.text[:300]}")


def upsert_portfolio_rows(rows: list[dict], dry_run: bool = False) -> None:
    if dry_run:
        print(json.dumps(rows, indent=2))
        return

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/partner_portfolio_files?on_conflict=partner_id,storage_path",
        headers=headers(),
        json=rows,
        timeout=60,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Upsert failed ({resp.status_code}): {resp.text[:500]}")


def build_upload_plan() -> list[dict]:
    partner_codes = fetch_partner_codes(list(PORTFOLIO_MAPPINGS.keys()))
    plan: list[dict] = []

    for partner_id, files in PORTFOLIO_MAPPINGS.items():
        partner_code = partner_codes.get(partner_id)
        if not partner_code:
            raise RuntimeError(f"Partner {partner_id} not found in database.")

        for filename, display_name, display_order in files:
            local_path = PORTFOLIO_DIR / filename
            if not local_path.exists():
                raise FileNotFoundError(f"Missing PDF: {local_path}")

            storage_path = f"{UK_BRANCH_CODE}/{partner_code.lower()}/{filename}"
            plan.append(
                {
                    "partner_id": partner_id,
                    "partner_code": partner_code,
                    "filename": filename,
                    "display_name": display_name,
                    "display_order": display_order,
                    "local_path": str(local_path),
                    "storage_path": storage_path,
                    "size_bytes": local_path.stat().st_size,
                }
            )

    return plan


def upload_portfolios(dry_run: bool = False) -> None:
    plan = build_upload_plan()
    upsert_rows: list[dict] = []

    for item in plan:
        print(
            f"{'[dry-run] ' if dry_run else ''}"
            f"{item['filename']} -> {BUCKET}/{item['storage_path']} "
            f"({item['size_bytes']:,} bytes)"
        )
        if not dry_run:
            upload_pdf(item["storage_path"], Path(item["local_path"]))

        upsert_rows.append(
            {
                "partner_id": item["partner_id"],
                "storage_path": item["storage_path"],
                "display_name": item["display_name"],
                "display_order": item["display_order"],
                "is_active": True,
            }
        )

    print(f"\nUpserting {len(upsert_rows)} partner_portfolio_files row(s)...")
    upsert_portfolio_rows(upsert_rows, dry_run=dry_run)


def main() -> int:
    global SERVICE_KEY

    load_env()
    SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)

    parser = argparse.ArgumentParser(description="Upload partner portfolio PDFs to Supabase Storage.")
    parser.add_argument("--dry-run", action="store_true", help="Print upload plan and upsert payload only.")
    parser.add_argument("--upload-only", action="store_true", help="Skip migration attempt.")
    args = parser.parse_args()

    if not args.upload_only and not table_exists():
        print("partner_portfolio_files table not found. Attempting migration...")
        try:
            apply_migration_with_psycopg()
            print("Migration applied.")
        except Exception as exc:
            print(f"Could not apply migration automatically: {exc}", file=sys.stderr)
            print(
                "\nRun the SQL manually in Supabase SQL Editor or via `supabase db push`:\n"
                f"  {MIGRATION_PATH}\n"
                "Then re-run: python scripts/upload_partner_portfolios.py --upload-only",
                file=sys.stderr,
            )
            return 1

        if not table_exists():
            print("Migration reported success but partner_portfolio_files is still missing.", file=sys.stderr)
            return 1

    print("Uploading partner portfolio PDFs...")
    upload_portfolios(dry_run=args.dry_run)
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
