#!/usr/bin/env python3
"""
Apply nav_link_settings migration and seed default UK nav visibility.

Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.
For DDL, also set SUPABASE_DB_PASSWORD (database password from Supabase dashboard).

Usage:
  python scripts/seed_nav_link_settings.py
  python scripts/seed_nav_link_settings.py --dry-run
  python scripts/seed_nav_link_settings.py --seed-only
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PATH = ROOT / "supabase" / "migrations" / "20250707120000_create_nav_link_settings.sql"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2

DEFAULT_SETTINGS = [
    ("partners", False, 1),
    ("blog", False, 2),
    ("home_specialties", True, 10),
    ("home_featured_products", True, 20),
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
        f"{SUPABASE_URL}/rest/v1/nav_link_settings?select=nav_link_setting_id&limit=1",
        headers=headers(),
        timeout=30,
    )
    if resp.status_code == 200:
        return True
    if resp.status_code == 404:
        return False
    raise RuntimeError(
        f"Unexpected status checking nav_link_settings ({resp.status_code}): {resp.text[:300]}"
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
    host = os.environ.get(
        "SUPABASE_DB_HOST",
        "aws-0-eu-central-1.pooler.supabase.com",
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


def seed_settings(dry_run: bool = False) -> None:
    payload = [
        {
            "branch_id": UK_BRANCH_ID,
            "nav_key": nav_key,
            "is_visible": is_visible,
            "display_order": display_order,
        }
        for nav_key, is_visible, display_order in DEFAULT_SETTINGS
    ]

    if dry_run:
        print(json_dumps(payload))
        return

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/nav_link_settings?on_conflict=branch_id,nav_key",
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

    parser = argparse.ArgumentParser(description="Apply nav_link_settings migration and seed defaults.")
    parser.add_argument("--dry-run", action="store_true", help="Print seed payload only.")
    parser.add_argument("--seed-only", action="store_true", help="Skip migration attempt.")
    args = parser.parse_args()

    if not args.seed_only and not table_exists():
        print("nav_link_settings table not found. Attempting migration...")
        try:
            apply_migration_with_psycopg()
            print("Migration applied.")
        except Exception as exc:
            print(f"Could not apply migration automatically: {exc}", file=sys.stderr)
            print(
                "\nRun the SQL manually in Supabase SQL Editor:\n"
                f"  {MIGRATION_PATH}\n"
                "Then re-run: python scripts/seed_nav_link_settings.py --seed-only",
                file=sys.stderr,
            )
            return 1

        if not table_exists():
            print("Migration reported success but nav_link_settings is still missing.", file=sys.stderr)
            return 1

    print("Seeding default UK nav link settings...")
    seed_settings(dry_run=args.dry_run)
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
