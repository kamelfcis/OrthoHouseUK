#!/usr/bin/env python3
"""Seed Mirai subcategories and import brochure products into Supabase.

Requires:
  SUPABASE_SERVICE_ROLE_KEY  (never commit this)
  VITE_SUPABASE_URL          (optional; defaults to project URL)

Usage:
  npm run import-mirai
  python scripts/import_mirai_catalog.py [--dry-run]
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
CATALOG_DIR = ROOT / "Permedica-Mirai-Shoulder-System"
PRODUCTS_JSON = CATALOG_DIR / "products.json"

SUPABASE_URL = os.environ.get(
    "VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co"
).rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

UK_BRANCH_CODE = "UK"
PERMEDICA_PARTNER_HINTS = ("permedica", "per medica")

SUBCATEGORIES = [
    {
        "category_code": "mirai_anatomic",
        "category_name": "Mirai Anatomic Shoulder System",
        "description": "Permedica Mirai anatomic configuration",
    },
    {
        "category_code": "mirai_reverse",
        "category_name": "Mirai Reverse Shoulder System",
        "description": "Permedica Mirai reverse configuration",
    },
    {
        "category_code": "mirai_humeral_core",
        "category_name": "Mirai Humeral Core Cage",
        "description": "Permedica Mirai humeral core cage and platform",
    },
]

# Map brochure product names → subcategory code (Trauma Core under Anatomic only)
PRODUCT_SUBCATEGORY = {
    "mirai anatomical configuration": "mirai_anatomic",
    "mirai anatomic humeral head": "mirai_anatomic",
    "mirai anatomic glenoid insert": "mirai_anatomic",
    "mirai cta humeral head": "mirai_anatomic",
    "mirai conversion into stemmed implant": "mirai_anatomic",
    "mirai trauma core": "mirai_anatomic",
    "mirai reverse configuration": "mirai_reverse",
    "mirai humeral insert": "mirai_reverse",
    "mirai glenosphere": "mirai_reverse",
    "mirai humeral core cage": "mirai_humeral_core",
    "mirai trabecular laser melted titanium (traser)": "mirai_humeral_core",
    "mirai glenoid baseplate": "mirai_humeral_core",
    "mirai system overview - 1 system, always 2 possibilities": "mirai_humeral_core",
    "mirai system overview — 1 system, always 2 possibilities": "mirai_humeral_core",
    "mirai materials and technologies": "mirai_humeral_core",
    "mirai revision configuration": "mirai_humeral_core",
    "mirai 3d planning": "mirai_humeral_core",
}


def normalize_name(value: str) -> str:
    text = value.strip().lower()
    text = text.replace("\u2014", "-").replace("\u2013", "-").replace("—", "-").replace("–", "-")
    return re.sub(r"\s+", " ", text)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:60] or "product"


def product_code_for(name: str) -> str:
    prefix = "MIRAI-"
    slug = slugify(name).upper()
    max_len = 50 - len(prefix)
    if len(slug) > max_len:
        slug = slug[:max_len].rstrip("-")
    return f"{prefix}{slug}"


def match_subcategory_code(name: str) -> str | None:
    key = normalize_name(name)
    if key in PRODUCT_SUBCATEGORY:
        return PRODUCT_SUBCATEGORY[key]

    for pattern, code in PRODUCT_SUBCATEGORY.items():
        if pattern in key or key in pattern:
            return code

    # Fuzzy fallbacks for slight name variants
    if "system overview" in key:
        return "mirai_humeral_core"
    if "traser" in key:
        return "mirai_humeral_core"
    if "trauma core" in key:
        return "mirai_anatomic"
    if "anatomical" in key or "anatomic" in key:
        return "mirai_anatomic"
    if "reverse" in key or "glenosphere" in key or "humeral insert" in key:
        return "mirai_reverse"
    if "humeral core" in key or "glenoid baseplate" in key or "3d planning" in key:
        return "mirai_humeral_core"
    if "materials" in key or "revision" in key:
        return "mirai_humeral_core"
    return None


def sb_headers(prefer: str | None = "return=representation") -> dict:
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def sb_rest(method: str, path: str, **kwargs):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    r = requests.request(method, url, headers=sb_headers(), timeout=60, **kwargs)
    if r.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:500]}")
    if not r.text:
        return None
    return r.json()


def resolve_uk_branch() -> dict:
    rows = sb_rest(
        "GET",
        f"branches?branch_code=eq.{UK_BRANCH_CODE}&is_active=eq.true&select=branch_id,branch_code,branch_name",
    )
    if not rows:
        raise RuntimeError("UK branch not found")
    return rows[0]


def resolve_permedica_partner() -> int:
    rows = sb_rest("GET", "partners?select=partner_id,partner_name&is_active=eq.true")
    for row in rows or []:
        name = (row.get("partner_name") or "").lower()
        if any(h in name for h in PERMEDICA_PARTNER_HINTS):
            return row["partner_id"]
    # Fallback known id from prior imports
    return 10


def resolve_shoulder_parent() -> dict:
    rows = sb_rest(
        "GET",
        "product_categories?select=category_id,category_name,category_code,parent_id&order=category_id.asc",
    )
    if not rows:
        raise RuntimeError("No product_categories found")

    preferred_codes = {"elbow_shoulder", "shoulder", "shoulder_arthroplasty"}
    for row in rows:
        code = (row.get("category_code") or "").lower()
        if code in preferred_codes and row.get("parent_id") is None:
            return row

    for row in rows:
        name = (row.get("category_name") or "").lower()
        if "shoulder" in name and row.get("parent_id") is None:
            return row

    raise RuntimeError(
        "Could not resolve Shoulder Arthroplasty parent category "
        "(looked for elbow_shoulder / shoulder / name containing 'shoulder')"
    )


def upsert_subcategories(parent_id: int, dry_run: bool) -> dict[str, int]:
    existing = sb_rest(
        "GET",
        "product_categories?select=category_id,category_code,category_name,parent_id",
    ) or []
    by_code = {
        (r.get("category_code") or "").lower(): r
        for r in existing
        if r.get("category_code")
    }

    result: dict[str, int] = {}
    for sub in SUBCATEGORIES:
        code = sub["category_code"]
        payload = {
            "category_name": sub["category_name"],
            "category_code": code,
            "description": sub["description"],
            "is_active": True,
            "parent_id": parent_id,
        }
        found = by_code.get(code.lower())
        if found:
            if not dry_run:
                sb_rest(
                    "PATCH",
                    f"product_categories?category_id=eq.{found['category_id']}",
                    json=payload,
                )
            result[code] = found["category_id"]
            print(f"  Updated subcategory {code} -> id {found['category_id']}")
        else:
            if dry_run:
                print(f"  [dry-run] Would create subcategory {code}")
                result[code] = -1
            else:
                rows = sb_rest("POST", "product_categories", json=payload)
                cid = rows[0]["category_id"]
                result[code] = cid
                print(f"  Created subcategory {code} -> id {cid}")
    return result


def upload_image(local_path: Path, storage_path: str) -> str:
    content_type = "image/png"
    suffix = local_path.suffix.lower()
    if suffix in (".jpg", ".jpeg"):
        content_type = "image/jpeg"
    elif suffix == ".webp":
        content_type = "image/webp"
    elif suffix == ".gif":
        content_type = "image/gif"

    url = f"{SUPABASE_URL}/storage/v1/object/product-images/{storage_path}"
    with open(local_path, "rb") as f:
        r = requests.post(
            url,
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            data=f.read(),
            timeout=120,
        )
    if r.status_code >= 400:
        raise RuntimeError(f"Upload {storage_path} -> {r.status_code}: {r.text[:300]}")
    return storage_path


def find_product_by_code(code: str):
    rows = sb_rest(
        "GET",
        f"products?product_code=eq.{requests.utils.quote(code, safe='')}&select=product_id,product_code",
    )
    return rows[0] if rows else None


def ensure_branch_product(product_id: int, branch_id: int, description: str | None, dry_run: bool):
    existing = sb_rest(
        "GET",
        f"branch_products?product_id=eq.{product_id}&branch_id=eq.{branch_id}&select=branch_product_id",
    )
    if existing:
        if not dry_run:
            sb_rest(
                "PATCH",
                f"branch_products?branch_product_id=eq.{existing[0]['branch_product_id']}",
                json={
                    "is_available": True,
                    "is_public": True,
                    "local_description": description or None,
                },
            )
        return existing[0]["branch_product_id"]

    if dry_run:
        return None

    rows = sb_rest(
        "POST",
        "branch_products",
        json={
            "product_id": product_id,
            "branch_id": branch_id,
            "is_available": True,
            "is_public": True,
            "local_description": description or None,
        },
    )
    return rows[0]["branch_product_id"]


def import_products(
    catalog: list,
    subcat_ids: dict[str, int],
    branch: dict,
    partner_id: int,
    dry_run: bool,
) -> dict:
    stats = {
        "created": 0,
        "updated": 0,
        "images_uploaded": 0,
        "image_records": 0,
        "skipped": 0,
        "errors": [],
    }
    branch_id = branch["branch_id"]
    branch_code = branch.get("branch_code") or UK_BRANCH_CODE

    for item in catalog:
        name = (item.get("name") or "").strip()
        if not name:
            stats["skipped"] += 1
            continue

        sub_code = match_subcategory_code(name)
        if not sub_code or sub_code not in subcat_ids:
            stats["errors"].append(f"No subcategory mapping for: {name}")
            continue

        category_id = subcat_ids[sub_code]
        code = product_code_for(name)
        specs = item.get("specs") or []
        specs_text = "\n".join(s.strip() for s in specs if s and str(s).strip())
        description = (item.get("description") or "").strip() or None

        payload = {
            "product_name": name,
            "product_code": code,
            "category_id": category_id,
            "partner_id": partner_id,
            "description": description,
            "specifications": specs_text or None,
            "is_active": True,
        }

        try:
            existing = None if dry_run and category_id < 0 else find_product_by_code(code)
            if existing:
                product_id = existing["product_id"]
                if not dry_run:
                    sb_rest(
                        "PATCH",
                        f"products?product_id=eq.{product_id}",
                        json=payload,
                    )
                stats["updated"] += 1
                print(f"  Updated {code} ({name})")
            else:
                if dry_run:
                    product_id = None
                    stats["created"] += 1
                    print(f"  [dry-run] Would create {code} ({name})")
                else:
                    rows = sb_rest("POST", "products", json=payload)
                    product_id = rows[0]["product_id"]
                    stats["created"] += 1
                    print(f"  Created {code} -> id {product_id}")

            if product_id is None:
                continue

            ensure_branch_product(product_id, branch_id, description, dry_run)

            images = item.get("images") or []
            # Prefer a reasonable primary set (first up to 6 images)
            images = images[:6]
            if not images:
                continue

            if not dry_run:
                sb_rest(
                    "DELETE",
                    f"product_images?product_id=eq.{product_id}&branch_id=eq.{branch_id}",
                )

            for idx, rel_path in enumerate(images):
                local = CATALOG_DIR / rel_path
                if not local.exists():
                    stats["errors"].append(f"Missing image {rel_path} for {name}")
                    continue

                ext = local.suffix or ".png"
                storage_name = f"{int(time.time() * 1000)}_{slugify(name)}_{idx + 1}{ext}"
                storage_path = f"{branch_code}/{storage_name}"

                if dry_run:
                    stats["images_uploaded"] += 1
                    continue

                upload_image(local, storage_path)
                stats["images_uploaded"] += 1
                sb_rest(
                    "POST",
                    "product_images",
                    json={
                        "product_id": product_id,
                        "branch_id": branch_id,
                        "image_url": storage_path,
                        "image_alt_text": name,
                        "image_type": "gallery",
                        "image_order": idx + 1,
                        "is_primary": idx == 0,
                    },
                )
                stats["image_records"] += 1

        except Exception as exc:  # noqa: BLE001
            stats["errors"].append(f"{name}: {exc}")

    return stats


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    if not SERVICE_KEY:
        print(
            "ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required.\n"
            "Set it in your shell (do not commit it), then re-run.",
            file=sys.stderr,
        )
        return 1

    if not PRODUCTS_JSON.exists():
        print(f"ERROR: Catalog not found at {PRODUCTS_JSON}", file=sys.stderr)
        return 1

    catalog = json.loads(PRODUCTS_JSON.read_text(encoding="utf-8"))
    if not isinstance(catalog, list) or len(catalog) == 0:
        print("ERROR: products.json is empty or invalid", file=sys.stderr)
        return 1

    print(f"Supabase: {SUPABASE_URL}")
    print(f"Catalog products: {len(catalog)}")
    if dry_run:
        print("Mode: dry-run (no writes)")

    branch = resolve_uk_branch()
    partner_id = resolve_permedica_partner()
    parent = resolve_shoulder_parent()
    print(
        f"UK branch_id={branch['branch_id']}, "
        f"partner_id={partner_id}, "
        f"parent={parent['category_name']} (id={parent['category_id']})"
    )

    print("Seeding Mirai subcategories…")
    subcat_ids = upsert_subcategories(parent["category_id"], dry_run=dry_run)

    print("Importing Mirai products…")
    stats = import_products(catalog, subcat_ids, branch, partner_id, dry_run=dry_run)
    print(json.dumps(stats, indent=2))

    if stats["errors"]:
        print(f"Completed with {len(stats['errors'])} error(s).", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
