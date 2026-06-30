#!/usr/bin/env python3
"""
Merge-upsert portfolio partners, categories, and products into Supabase UK branch.

Requires SUPABASE_SERVICE_ROLE_KEY in .env

Usage:
  python scripts/seed_portfolio_to_supabase.py --dry-run
  python scripts/seed_portfolio_to_supabase.py
  python scripts/seed_portfolio_to_supabase.py --partners-only
  python scripts/seed_portfolio_to_supabase.py --products-only --skip-images
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "scripts" / "tmp" / "portfolio_manifest.json"
RAW_DIR = ROOT / "scripts" / "tmp" / "portfolio" / "raw"
PUBLIC_PARTNERS = ROOT / "public" / "assets" / "partners"
DOC_IMAGES = ROOT / "scripts" / "tmp" / "product_images"
SUMMARY_PATH = ROOT / "scripts" / "tmp" / "portfolio_seed_summary.json"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2
UK_BRANCH_CODE = "UK"

KNOWN_CATEGORY_IDS = {
    "hand_wrist": 9,
    "elbow_shoulder": 10,
    "foot_ankle": 11,
    "bone_graft": 8,
}

KNOWN_PARTNER_IDS = {
    "ASTROLABE": 20,
    "PERMEDICA": 10,
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
    global SERVICE_KEY, SUPABASE_URL
    SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)
    SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", SUPABASE_URL).rstrip("/")


def headers(prefer: str = "return=representation") -> dict[str, str]:
    if not SERVICE_KEY:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required. Add it to .env")
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def sb(method: str, path: str, **kwargs):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    r = requests.request(method, url, headers=headers(), timeout=90, **kwargs)
    if r.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:500]}")
    return r.json() if r.text else None


def upload_storage(bucket: str, storage_path: str, local_path: Path, content_type: str) -> None:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{storage_path}"
    with local_path.open("rb") as fh:
        r = requests.post(
            url,
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            data=fh.read(),
            timeout=120,
        )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload {storage_path} -> {r.status_code}: {r.text[:300]}")


def slug_code(name: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "_", name.upper()).strip("_")[:60]


def resolve_image_file(product: dict) -> Path | None:
    for ref in product.get("portfolio_images") or []:
        p = RAW_DIR / ref
        if p.exists():
            return p
    for ref in product.get("images") or []:
        if "/" in ref:
            p = RAW_DIR / ref
        else:
            p = DOC_IMAGES / ref
        if p.exists():
            return p
    base = product.get("image_optimized_base")
    if base:
        base_path = ROOT / "public" / base.lstrip("/").replace("/", os.sep)
        p = Path(f"{base_path}-800.webp")
        if p.exists():
            return p
    return None


def fetch_partners_map() -> dict[str, dict]:
    rows = sb("GET", "partners?select=partner_id,partner_code,partner_name") or []
    return {r["partner_code"].upper(): r for r in rows if r.get("partner_code")}


def fetch_categories_map() -> dict[str, dict]:
    rows = sb("GET", "product_categories?select=category_id,category_code,category_name") or []
    by_code = {}
    for r in rows:
        code = (r.get("category_code") or "").lower()
        if code:
            by_code[code] = r
    return by_code


def fetch_products_map() -> dict[str, dict]:
    rows = sb("GET", "products?select=product_id,product_code,partner_id,product_name") or []
    result = {}
    for r in rows:
        code = (r.get("product_code") or "").upper()
        pid = r.get("partner_id")
        result[f"{pid}:{code}"] = r
    return result


def seed_partners(manifest: dict, dry_run: bool, stats: dict) -> dict[str, int]:
    partner_ids: dict[str, int] = {}
    existing = fetch_partners_map() if not dry_run else {}

    for p in manifest.get("partners", []):
        code = p["partner_code"].upper()
        payload = {
            "partner_name": p["partner_name"],
            "partner_code": code,
            "partnership_type": p.get("partnership_type", "manufacturer"),
            "description": p.get("description"),
            "website_url": p.get("website_url"),
            "is_active": True,
        }

        logo_storage = None
        logo_local = None
        if p.get("logo_optimized"):
            logo_local = ROOT / "public" / p["logo_optimized"].lstrip("/").replace("/", os.sep)
        elif p.get("logo_file"):
            logo_local = RAW_DIR / p["logo_file"]

        if logo_local and logo_local.exists():
            ext = logo_local.suffix.lower()
            logo_storage = f"partner-logos/{code.lower()}_logo{ext if ext != '.webp' else '.webp'}"
            if logo_local.suffix != ".webp":
                webp = PUBLIC_PARTNERS / code.lower() / "logo.webp"
                if webp.exists():
                    logo_local = webp
                    logo_storage = f"partner-logos/{code.lower()}_logo.webp"

        if logo_storage and not dry_run and logo_local and logo_local.exists():
            ct = "image/webp" if logo_local.suffix == ".webp" else "image/png"
            upload_storage("partner-logos", logo_storage, logo_local, ct)
            payload["logo_url"] = logo_storage

        if code in existing:
            partner_id = existing[code]["partner_id"]
            if not dry_run:
                sb("PATCH", f"partners?partner_id=eq.{partner_id}", json=payload)
            stats["partners_updated"] += 1
        elif code in KNOWN_PARTNER_IDS:
            partner_id = KNOWN_PARTNER_IDS[code]
            if not dry_run:
                sb("PATCH", f"partners?partner_id=eq.{partner_id}", json=payload)
            stats["partners_updated"] += 1
        else:
            if dry_run:
                partner_id = -1
                stats["partners_created"] += 1
            else:
                rows = sb("POST", "partners", json=payload)
                partner_id = rows[0]["partner_id"]
                stats["partners_created"] += 1

        partner_ids[code] = partner_id

        if not dry_run and partner_id > 0:
            bp = sb("GET", f"branch_partners?branch_id=eq.{UK_BRANCH_ID}&partner_id=eq.{partner_id}&select=branch_partner_id")
            if not bp:
                sb("POST", "branch_partners", json={
                    "branch_id": UK_BRANCH_ID,
                    "partner_id": partner_id,
                    "is_active": True,
                })
                stats["branch_partners_linked"] += 1

    return partner_ids


def seed_products(
    manifest: dict,
    partner_ids: dict[str, int],
    dry_run: bool,
    skip_images: bool,
    stats: dict,
) -> None:
    categories = fetch_categories_map() if not dry_run else {}
    existing_products = fetch_products_map() if not dry_run else {}

    for p in manifest.get("products", []):
        partner_code = (p.get("partner_code") or "ASTROLABE").upper()
        partner_id = partner_ids.get(partner_code) or KNOWN_PARTNER_IDS.get(partner_code)
        if not partner_id and dry_run:
            partner_id = KNOWN_PARTNER_IDS.get(partner_code, 20)

        cat_code = (p.get("category_code") or "foot_ankle").lower()
        category_id = p.get("category_id") or KNOWN_CATEGORY_IDS.get(cat_code)
        if not category_id and not dry_run:
            cat_row = categories.get(cat_code)
            if cat_row:
                category_id = cat_row["category_id"]

        product_code = (p.get("product_code") or slug_code(p.get("name", "PRODUCT"))).upper()
        payload = {
            "product_name": p.get("name"),
            "product_code": product_code,
            "category_id": category_id,
            "partner_id": partner_id,
            "description": p.get("description") or None,
            "specifications": p.get("specifications_text") or None,
            "is_active": True,
        }

        lookup = f"{partner_id}:{product_code}"
        product_id = p.get("product_id")

        if not dry_run:
            if lookup in existing_products:
                product_id = existing_products[lookup]["product_id"]
                sb("PATCH", f"products?product_id=eq.{product_id}", json=payload)
                stats["products_updated"] += 1
            elif product_id:
                sb("PATCH", f"products?product_id=eq.{product_id}", json=payload)
                stats["products_updated"] += 1
            else:
                rows = sb("POST", "products", json=payload)
                product_id = rows[0]["product_id"]
                stats["products_created"] += 1
        else:
            if product_id or lookup in existing_products:
                stats["products_updated"] += 1
            else:
                stats["products_created"] += 1
            continue

        # branch_products
        bp = sb("GET", f"branch_products?product_id=eq.{product_id}&branch_id=eq.{UK_BRANCH_ID}&select=branch_product_id")
        if not bp:
            sb("POST", "branch_products", json={
                "product_id": product_id,
                "branch_id": UK_BRANCH_ID,
                "is_available": True,
                "is_public": True,
                "local_description": p.get("description") or None,
            })
            stats["branch_products_linked"] += 1

        if skip_images:
            continue

        img_path = resolve_image_file(p)
        if not img_path:
            stats["errors"].append(f"No image file for {p.get('name')}")
            continue

        # Use optimized 800 webp if available
        opt_base = p.get("image_optimized_base")
        if opt_base:
            base_path = ROOT / "public" / opt_base.lstrip("/").replace("/", os.sep)
            opt_800 = Path(f"{base_path}-800.webp")
            if opt_800.exists():
                img_path = opt_800

        sb("DELETE", f"product_images?product_id=eq.{product_id}&branch_id=eq.{UK_BRANCH_ID}")

        ext = img_path.suffix.lower()
        storage_name = f"{int(time.time() * 1000)}_{p.get('key', product_code)}{ext}"
        storage_path = f"{UK_BRANCH_CODE}/{storage_name}"
        content_type = "image/webp" if ext == ".webp" else "image/png"
        upload_storage("product-images", storage_path, img_path, content_type)
        stats["images_uploaded"] += 1

        sb("POST", "product_images", json={
            "product_id": product_id,
            "branch_id": UK_BRANCH_ID,
            "image_url": storage_path,
            "image_alt_text": p.get("name"),
            "image_type": "gallery",
            "image_order": 1,
            "is_primary": True,
        })
        stats["image_records"] += 1


def main() -> int:
    load_env()
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--partners-only", action="store_true")
    parser.add_argument("--products-only", action="store_true")
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    if not MANIFEST_PATH.exists():
        print(f"Missing manifest. Run: python scripts/extract_portfolio.py", file=sys.stderr)
        return 1

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    stats = {
        "partners_created": 0,
        "partners_updated": 0,
        "branch_partners_linked": 0,
        "products_created": 0,
        "products_updated": 0,
        "branch_products_linked": 0,
        "images_uploaded": 0,
        "image_records": 0,
        "errors": [],
        "dry_run": args.dry_run,
    }

    partner_ids: dict[str, int] = {}

    if not args.products_only:
        partner_ids = seed_partners(manifest, args.dry_run, stats)

    if not args.partners_only:
        if not partner_ids and not args.dry_run:
            partner_ids = {code: row["partner_id"] for code, row in fetch_partners_map().items()}
            for code, pid in KNOWN_PARTNER_IDS.items():
                partner_ids.setdefault(code, pid)
        elif args.dry_run:
            partner_ids = {**KNOWN_PARTNER_IDS, "ORTHOSINTEX": -2}
        seed_products(manifest, partner_ids, args.dry_run, args.skip_images, stats)

    SUMMARY_PATH.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print(json.dumps(stats, indent=2))
    print(f"Summary written to {SUMMARY_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
