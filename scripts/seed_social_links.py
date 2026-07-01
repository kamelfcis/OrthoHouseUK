#!/usr/bin/env python3
"""
Apply social_links migration and seed default UK footer links.

Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.
For DDL, also set SUPABASE_DB_PASSWORD (database password from Supabase dashboard).

Usage:
  python scripts/seed_social_links.py
  python scripts/seed_social_links.py --dry-run
  python scripts/seed_social_links.py --seed-only
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PATH = ROOT / "supabase" / "migrations" / "20250630190000_create_social_links.sql"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2

DEFAULT_LINKS = [
    ("linkedin", "https://uk.linkedin.com/company/orthohouse-uk", 1),
    ("facebook", "https://www.facebook.com/OrthoHouseEgy", 2),
    ("twitter", "https://x.com/OrthoHouseEgy", 3),
    ("youtube", "https://www.youtube.com/@orthohouse", 4),
    ("instagram", "https://www.instagram.com/ortho.house/", 5),
    ("snapchat", "https://www.snapchat.com/add/ortho.house1", 6),
    ("tiktok", "https://www.tiktok.com/@ortho_house/", 7),
    ("email", "mailto:info@ortho-house.com", 8),
]


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


def headers() -> dict[str, str]:
    if not SERVICE_KEY:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required.")
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }


def table_exists() -> bool:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/social_links?select=social_link_id&limit=1",
        headers=headers(),
        timeout=30,
    )
    if resp.status_code == 200:
        return True
    if resp.status_code == 404:
        return False
    raise RuntimeError(f"Unexpected status checking social_links ({resp.status_code}): {resp.text[:300]}")


def apply_migration_with_psycopg() -> None:
    password = os.environ.get("SUPABASE_DB_PASSWORD")
    if not password:
        raise RuntimeError("SUPABASE_DB_PASSWORD is not set.")

    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("Install psycopg2-binary to apply migrations from this script.") from exc

    project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]
    host = os.environ.get(
        "SUPABASE_DB_HOST",
        f"aws-0-eu-central-1.pooler.supabase.com",
    )
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


def seed_links(dry_run: bool = False) -> None:
    payload = [
        {
            "branch_id": UK_BRANCH_ID,
            "platform": platform,
            "url": url,
            "is_visible": True,
            "display_order": display_order,
        }
        for platform, url, display_order in DEFAULT_LINKS
    ]

    if dry_run:
        print(json_dumps(payload))
        return

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/social_links?on_conflict=branch_id,platform",
        headers=headers(),
        json=payload,
        timeout=60,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Seed failed ({resp.status_code}): {resp.text[:500]}")


def json_dumps(data) -> str:
    import json

    return json.dumps(data, indent=2)


def main() -> int:
    global SERVICE_KEY

    load_env()
    SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)

    parser = argparse.ArgumentParser(description="Apply social_links migration and seed defaults.")
    parser.add_argument("--dry-run", action="store_true", help="Print seed payload only.")
    parser.add_argument("--seed-only", action="store_true", help="Skip migration attempt.")
    args = parser.parse_args()

    if not args.seed_only and not table_exists():
        print("social_links table not found. Attempting migration...")
        try:
            apply_migration_with_psycopg()
            print("Migration applied.")
        except Exception as exc:
            print(f"Could not apply migration automatically: {exc}", file=sys.stderr)
            print(
                "\nRun the SQL manually in Supabase SQL Editor:\n"
                f"  {MIGRATION_PATH}\n"
                "Then re-run: python scripts/seed_social_links.py --seed-only",
                file=sys.stderr,
            )
            return 1

        if not table_exists():
            print("Migration reported success but social_links is still missing.", file=sys.stderr)
            return 1

    print("Seeding default UK social links...")
    seed_links(dry_run=args.dry_run)
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
