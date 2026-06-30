#!/usr/bin/env python3
"""
Extract partner logos and product images from Portofolio/ PDFs.
Outputs scripts/tmp/portfolio_manifest.json merged with parsed_products.json.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "Portofolio"
RAW_DIR = ROOT / "scripts" / "tmp" / "portfolio" / "raw"
MANIFEST_PATH = ROOT / "scripts" / "tmp" / "portfolio_manifest.json"
PARSED_PATH = ROOT / "scripts" / "tmp" / "parsed_products.json"

MIN_IMAGE = 200
MIN_LOGO = 400

PARTNERS = [
    {
        "partner_code": "ASTROLABE",
        "partner_name": "Astrolabe",
        "partnership_type": "manufacturer",
        "description": "Advanced trauma fixation systems distributed across the UK by OrthoHouse.",
        "website_url": "https://www.astrolabe.com",
        "logo_source_pdf": "Osteosynt_brosura.pdf",
    },
    {
        "partner_code": "PERMEDICA",
        "partner_name": "Permedica",
        "partnership_type": "manufacturer",
        "description": "Joint replacement and shoulder arthroplasty solutions for UK elective programmes.",
        "website_url": "https://www.permedica.it",
        "logo_source_pdf": "D042EN Rev.04.0 Brochure Mirai_A4.pdf",
    },
    {
        "partner_code": "ORTHOSINTEX",
        "partner_name": "Orthosintex",
        "partnership_type": "manufacturer",
        "description": "Episcan foot and ankle implant systems for lower-extremity reconstruction.",
        "website_url": None,
        "logo_source_pdf": "Orthosintex Episcan Foot and Ankle 2025.pdf",
    },
]

# PDF filename fragment -> product keys (portfolio hero image assignment)
PDF_PRODUCT_MAP = {
    "Humerus-Full-Set": ["humerus_proximal"],
    "Volar-e": ["volar_e"],
    "Combo-REV": ["combo_hand"],
    "Clavicle": ["clavicle"],
    "Mirai_A4": ["mirai"],
    "Mirai Reverse": ["mirai_reverse"],
    "Episcan": [
        "episcan_universal_plates",
        "tarsal_plate",
        "open_wedge_osteotomy",
        "mp_joint_arthrodesis",
        "lapidus_plates",
        "cotton_osteotomy",
        "arthrodesis_plates",
        "calcaneal_displacement",
        "evans_osteotomy",
        "interposition_plates",
        "diabetic_foot",
        "cannulated_cortical",
    ],
}

CATEGORY_CODES = {
    9: "hand_wrist",
    10: "elbow_shoulder",
    11: "foot_ankle",
    8: "bone_graft",
}

PARTNER_ID_MAP = {
    20: "ASTROLABE",
    10: "PERMEDICA",
}

EXTRA_PRODUCTS = [
    {
        "key": "clavicle",
        "product_code": "CLAVICLE",
        "name": "Clavicle locking plate",
        "partner_code": "ASTROLABE",
        "category_code": "elbow_shoulder",
        "category_id": 10,
        "partner_id": 20,
        "product_id": None,
        "description": "Clavicle fixation system for fracture stabilisation and reconstruction.",
        "specifications_text": "Titanium locking plate system for clavicle fractures.",
        "images": [],
        "source_pdf": "AST.BOX_030_Clavicle.pdf",
    },
    {
        "key": "mirai_reverse",
        "product_code": "MIRAI_REVERSE",
        "name": "Mirai Reverse shoulder system",
        "partner_code": "PERMEDICA",
        "category_code": "elbow_shoulder",
        "category_id": 10,
        "partner_id": 10,
        "product_id": None,
        "description": "Reverse shoulder arthroplasty system for rotator cuff deficient shoulders.",
        "specifications_text": "Modular reverse shoulder prosthesis by Permedica.",
        "images": [],
        "source_pdf": "IMPORTANT_Mirai Reverse Solutions_ENG.pdf",
    },
]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def pdf_slug(path: Path) -> str:
    return slugify(path.stem)[:60]


def extract_images_from_pdf(pdf_path: Path, out_dir: Path) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    seen: set[str] = set()
    images: list[dict] = []

    for page_index in range(len(doc)):
        page = doc[page_index]
        for img_index, img_info in enumerate(page.get_images(full=True)):
            xref = img_info[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            w, h = base.get("width", 0), base.get("height", 0)
            if w < MIN_IMAGE or h < MIN_IMAGE:
                continue
            data = base["image"]
            digest = hashlib.sha256(data).hexdigest()[:12]
            if digest in seen:
                continue
            seen.add(digest)
            ext = base.get("ext", "png")
            filename = f"p{page_index + 1:02d}_img{img_index + 1:02d}_{w}x{h}.{ext}"
            filepath = out_dir / filename
            filepath.write_bytes(data)
            images.append({
                "file": filename,
                "width": w,
                "height": h,
                "page": page_index + 1,
                "area": w * h,
            })

    doc.close()
    images.sort(key=lambda x: x["area"], reverse=True)
    return images


def pick_logo(images: list[dict]) -> str | None:
    """Best logo candidate from page 1 images."""
    page1 = [i for i in images if i["page"] == 1 and i["width"] >= MIN_LOGO]
    if not page1:
        page1 = [i for i in images if i["width"] >= MIN_LOGO]
    if not page1:
        return images[0]["file"] if images else None
    # Prefer wide logos
    page1.sort(key=lambda i: (i["width"] / max(i["height"], 1), i["area"]), reverse=True)
    return page1[0]["file"]


def pick_hero(images: list[dict]) -> str | None:
    if not images:
        return None
    # Largest image, prefer not tiny icons
    candidates = [i for i in images if i["width"] >= 400 and i["height"] >= 300]
    pool = candidates or images
    pool.sort(key=lambda x: x["area"], reverse=True)
    return pool[0]["file"]


def match_pdf_products(filename: str) -> list[str]:
    keys: list[str] = []
    for fragment, product_keys in PDF_PRODUCT_MAP.items():
        if fragment.lower() in filename.lower():
            keys.extend(product_keys)
    return keys


def load_parsed_products() -> list[dict]:
    if not PARSED_PATH.exists():
        return []
    data = json.loads(PARSED_PATH.read_text(encoding="utf-8"))
    products = []
    for p in data:
        partner_code = PARTNER_ID_MAP.get(p.get("partner_id"), "ASTROLABE")
        category_code = CATEGORY_CODES.get(p.get("category_id"), "foot_ankle")
        products.append({
            "key": p.get("key") or slugify(p.get("name", "product")),
            "product_code": re.sub(r"[^A-Z0-9]+", "_", p.get("name", "").upper()).strip("_")[:60]
            or p.get("product_code", "").upper().replace(" ", "_"),
            "name": p.get("name"),
            "partner_code": partner_code,
            "category_code": category_code,
            "category_id": p.get("category_id"),
            "partner_id": p.get("partner_id"),
            "product_id": p.get("product_id"),
            "description": p.get("description", ""),
            "specifications_text": p.get("specifications_text", ""),
            "images": p.get("images", []),
            "source_pdf": None,
        })
    return products


def merge_products(portfolio_images: dict[str, list[dict]]) -> list[dict]:
    by_key: dict[str, dict] = {}

    for p in load_parsed_products():
        by_key[p["key"]] = p

    for extra in EXTRA_PRODUCTS:
        by_key[extra["key"]] = extra

    # Assign portfolio hero images from PDFs
    for pdf_path in sorted(PORTFOLIO_DIR.glob("*.pdf")):
        if "Products Catalogue" in pdf_path.name:
            continue
        slug = pdf_slug(pdf_path)
        imgs = portfolio_images.get(slug, [])
        hero = pick_hero(imgs)
        if not hero:
            continue
        keys = match_pdf_products(pdf_path.name)
        for key in keys:
            if key in by_key:
                entry = by_key[key]
                if hero not in entry.get("portfolio_images", []):
                    entry.setdefault("portfolio_images", [])
                    if hero not in entry["portfolio_images"]:
                        entry["portfolio_images"].append(f"{slug}/{hero}")
                entry["source_pdf"] = pdf_path.name
                # Orthosintex episcan products
                if "Episcan" in pdf_path.name:
                    entry["partner_code"] = "ORTHOSINTEX"

    return list(by_key.values())


def build_partner_logos(portfolio_images: dict[str, list[dict]]) -> dict[str, str]:
    logos = {}
    for partner in PARTNERS:
        pdf_name = partner["logo_source_pdf"]
        pdf_path = PORTFOLIO_DIR / pdf_name
        if not pdf_path.exists():
            continue
        slug = pdf_slug(pdf_path)
        imgs = portfolio_images.get(slug, [])
        logo_file = pick_logo(imgs)
        if logo_file:
            logos[partner["partner_code"]] = f"{slug}/{logo_file}"
    return logos


def main() -> int:
    if not PORTFOLIO_DIR.exists():
        print(f"Missing {PORTFOLIO_DIR}", file=sys.stderr)
        return 1

    portfolio_images: dict[str, list[dict]] = {}
    extraction_report = []

    for pdf_path in sorted(PORTFOLIO_DIR.glob("*.pdf")):
        slug = pdf_slug(pdf_path)
        out_dir = RAW_DIR / slug
        imgs = extract_images_from_pdf(pdf_path, out_dir)
        portfolio_images[slug] = imgs
        extraction_report.append({
            "pdf": pdf_path.name,
            "slug": slug,
            "image_count": len(imgs),
            "logo_candidate": pick_logo(imgs),
            "hero_candidate": pick_hero(imgs),
        })
        print(f"  {pdf_path.name}: {len(imgs)} images")

    partner_logos = build_partner_logos(portfolio_images)
    products = merge_products(portfolio_images)

    manifest = {
        "partners": [
            {**p, "logo_file": partner_logos.get(p["partner_code"])}
            for p in PARTNERS
        ],
        "products": products,
        "extraction_report": extraction_report,
        "stats": {
            "pdfs": len(extraction_report),
            "products": len(products),
            "partners": len(PARTNERS),
        },
    }

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {MANIFEST_PATH}")
    print(f"  Partners: {len(PARTNERS)}, Products: {len(products)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
