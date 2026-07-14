#!/usr/bin/env python3
"""
Extract product text and images from Astrolabe Medical Products.pdf.
Outputs Astrolabe-Medical-Products/ with README.md, products.json, images/, SOURCE.txt.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "Astrolabe Medical Products.pdf"
OUT_DIR = ROOT / "Astrolabe-Medical-Products"
IMAGES_DIR = OUT_DIR / "images"
README_PATH = OUT_DIR / "README.md"
PRODUCTS_JSON_PATH = OUT_DIR / "products.json"
SOURCE_PATH = OUT_DIR / "SOURCE.txt"

MIN_IMAGE = 200
PRODUCT_PAGE_START = 4
PRODUCT_PAGE_END = 36

# Fallback names when heuristics miss (page -> name).
PAGE_NAME_FALLBACK: dict[int, str] = {
    4: "AstroCAN",
    5: "Cannulated Bone Screws (CBS)",
    6: "Cannulated Compression Screws (CCS)",
    7: "MultiFix Locking Plate System",
    8: "Combo Hand Ø1,2 / Ø1,7 / Ø2,3",
    9: "Carpal-Medial System (CMS) Ø2,3",
    10: "Radial-Carpal System (RCS) Ø2,0/2,7",
    11: "Small Plates System (SMA) Ø2,7",
    12: "Distal Radius Plates (DRP) Ø2,7",
    13: "Radius Special Plates System (RSS) Ø2,7",
    14: "Radius Locking System (RLS) Ø2,7",
    15: "LIVTrauma",
    16: "Small Fragments Ø3,5",
    17: "Humerus Proximal Ø3,5",
    18: "Clavicle Ø2,7/3,5",
    19: "Large Fragments Ø4,0/5,0",
    20: "Dynamic Hip Compression & Dynamic Condylar Screw (DHS/DCS) Ø4,0/5,0",
    21: "Femur Distal Ø4,0/5,0",
    22: "Tibia Proximal Ø4,0/5,0",
    23: "Metaphyseal Ø3,5|Ø4,0/5,0",
    24: "Fibula Distal Ø2,7/3,5",
    25: "Malleolus Ø3,5",
    26: "Rearfoot Plates System Ø3,5",
    27: "Arrow Plates Ø3,5",
    28: "Lapidus Ø2,7",
    29: "Akin and Weil",
    30: "Hallux Valgus Ø2,7/3,5",
    31: "Midfoot Ø2,7",
    32: "Forefoot Ø2,7",
    33: "Revision Ø2,7/3,5",
    34: "SmartFix Variable Angle Locking System",
    35: "Volar-e Ø2,4/2,7 System",
    36: "Tibia Osteotomy Ø4,5/5,0 (Orthos HTO)",
}

NAV_PHRASES = [
    "Cannulated Bone Screws",
    "Cannulated Compression Screws",
    "Extremity Hand System",
    "Upper Extremities Systems",
    "Upper Limb Trauma Systems",
    "Lower Limb Trauma Systems",
    "Lower Extremities Systems",
    "Lower Extremities\n Systems",
    "Volar-e\nRadius Distal \nSystem",
    "Radius Distal System",
    "Othos\nHigh Tibial \nOsteotomy System",
    "Orthos\nHigh Tibial \nOsteotomy System",
]

NAV_LINE_PATTERNS = [
    re.compile(r"^Cannulated\s+Bone\s*$", re.I),
    re.compile(r"^Screws$", re.I),
    re.compile(r"^Cannulated\s*$", re.I),
    re.compile(r"^Compression\s*$", re.I),
    re.compile(r"^Extremity\s+Hand\s*$", re.I),
    re.compile(r"^System$", re.I),
    re.compile(r"^Upper\s+Extremities\s*$", re.I),
    re.compile(r"^Systems$", re.I),
    re.compile(r"^Upper\s+Limb\s*$", re.I),
    re.compile(r"^Trauma\s+Systems$", re.I),
    re.compile(r"^Lower\s+Limb\s*$", re.I),
    re.compile(r"^Lower\s+Extremities\s*$", re.I),
    re.compile(r"^Radius\s+Distal\s*$", re.I),
    re.compile(r"^High\s+Tibial\s*$", re.I),
    re.compile(r"^Osteotomy\s+System$", re.I),
    re.compile(r"^Othos$", re.I),
    re.compile(r"^Orthos$", re.I),
    re.compile(r"^Volar-e$", re.I),
]

SKIP_LINE_PATTERNS = [
    re.compile(r"^Main\s+Indications$", re.I),
    re.compile(r"^Regular\s+Implant\s+Kit$", re.I),
    re.compile(r"^Remaining\s+Instrumental\s+and\s+Screws$", re.I),
    re.compile(r"^From\s+the\s+(Small|Large)\s+Fragments\s+Kits$", re.I),
    re.compile(r"^From\s+the\s+Small\s+&\s+Large\s+Fragments\s+Kits$", re.I),
    re.compile(r"^Full-Set\s+Kit$", re.I),
    re.compile(r"^Implant\s+Kit$", re.I),
    re.compile(r"^All\s+essential\s+components\s*$", re.I),
    re.compile(r"^for\s+implant\s+insertion$", re.I),
    re.compile(r"^\+54%\s+Material$", re.I),
    re.compile(r"^X$", re.I),
    re.compile(r"^\+$", re.I),
    re.compile(r"^Proximal\s+Humerus$", re.I),
    re.compile(r"^Distal\s+Humerus$", re.I),
    re.compile(r"^Proximal\s+Radius$", re.I),
    re.compile(r"^Radial\s+&\s+Ulnar\s+Styloid$", re.I),
    re.compile(r"^Femoral\s+Condyles$", re.I),
    re.compile(r"^Patella$", re.I),
    re.compile(r"^Tibial\s+Plateau$", re.I),
    re.compile(r"^Scaphoid$", re.I),
    re.compile(r"^Carpal\s+Arthrodesis$", re.I),
    re.compile(r"^MTP\s+Arthrodesis", re.I),
    re.compile(r"^Midfoot\s+Injuries", re.I),
    re.compile(r"^Rearfoot\s+Injuries", re.I),
    re.compile(r"^Partly$", re.I),
    re.compile(r"^Threaded$", re.I),
    re.compile(r"^Partly/Fully$", re.I),
    re.compile(r"^Short/Long$", re.I),
    re.compile(r"^Fully/16/32mm$", re.I),
]

SPEC_PREFIX = re.compile(r"^[\u207b\u2212\-–—]\s*")
PRODUCT_LINE = re.compile(r"^Product\s+Line$", re.I)


def slugify(text: str, max_len: int = 48) -> str:
    text = text.lower().strip()
    text = text.replace("ø", "o").replace("Ø", "o")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:max_len] or "product"


def strip_nav(raw: str) -> str:
    text = raw
    for phrase in NAV_PHRASES:
        text = text.replace(phrase, "\n")
    return text


def normalize_lines(raw: str) -> list[str]:
    text = strip_nav(raw)
    lines: list[str] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if any(p.match(line) for p in NAV_LINE_PATTERNS):
            continue
        if any(p.match(line) for p in SKIP_LINE_PATTERNS):
            continue
        lines.append(line)
    return lines


def is_spec_line(line: str) -> bool:
    return bool(SPEC_PREFIX.match(line))


def clean_spec(line: str) -> str:
    return SPEC_PREFIX.sub("", line).strip()


def is_table_variant_line(line: str) -> bool:
    return bool(
        re.match(r"^(CBS|CCS|Compression|Cannulated)\b", line, re.I)
        or re.match(r"^Cannulated\s+(Bone|Conical)", line, re.I)
        or re.match(r"^Ø\d", line)
    )


def looks_like_product_name(line: str) -> bool:
    if is_spec_line(line) or PRODUCT_LINE.match(line):
        return False
    if line in {"⁻", "-", "–", "—", "\u207b", "\u2212"}:
        return False
    if len(line) < 3 or len(line) > 100:
        return False
    if re.search(r"[;!?]\s*$", line):
        return False
    lowered = line.lower()
    if lowered in {"product line", "main indications", "implant kit"}:
        return False
    if re.match(r"^(designed|system|offers|indicated|divided|new|the|a|an|most|engineered|"
                r"featuring|metacarpal|surgery|and|reverse|titanium|headed|self|screws|torx)\b", lowered):
        return False
    if re.match(r"^(cbs|ccs)\s", lowered):
        return False
    if re.match(r"^screws\s", lowered):
        return False
    if re.match(r"^cannulated\s+(bone|conical)", lowered):
        return False
    if "Ø" in line or "ø" in line:
        return True
    if re.match(r"^(AstroCAN|LIVTrauma|SmartFix|Combo Hand|Carpal-Medial|Radial-Carpal|"
                r"Small Plates|Distal Radius|Radius Special|Radius Locking|Small Fragments|"
                r"Humerus Proximal|Clavicle|Large Fragments|Dynamic Hip|Femur Distal|"
                r"Tibia Proximal|Metaphyseal|Fibula Distal|Malleolus|Rearfoot|Arrow Plates|"
                r"Lapidus|Akin and Weil|Hallux Valgus|Midfoot|Forefoot|Revision|Volar-e|"
                r"Tibia Osteotomy|MultiFix)", line, re.I):
        return True
    if is_table_variant_line(line):
        return False
    if len(line) <= 60 and line[0].isupper() and len(line.split()) <= 8:
        if not re.search(r"\b(for|with|that|which|provides|ensuring|including|flutes|alloy)\b", lowered):
            return True
    return False


def infer_name_from_description(description: str) -> str | None:
    if not description:
        return None
    for token in ("AstroCAN", "LIVTrauma", "SmartFix"):
        if token in description:
            return token
    if "MultiFix" in description:
        return "MultiFix Locking Plate System"
    return None


def choose_name(page_num: int, explicit_names: list[str], description: str) -> str:
    fallback = PAGE_NAME_FALLBACK.get(page_num)
    explicit = explicit_names[-1] if explicit_names else None
    inferred = infer_name_from_description(description)

    weak_explicit = bool(
        explicit
        and (
            explicit in {"Full Kit", "Regular Implant Kit", "Implant Kit", "SmartFix"}
            or re.match(r"^\(", explicit)
        )
    )

    if page_num in {4, 5, 6}:
        return fallback or explicit or inferred or f"Product (page {page_num})"
    if explicit and not weak_explicit:
        return explicit
    if fallback and (not inferred or (inferred in fallback and inferred != fallback)):
        return fallback
    return inferred or fallback or explicit or f"Product (page {page_num})"


def parse_page(page_num: int, raw: str) -> dict | None:
    lines = normalize_lines(raw)
    if not lines:
        return None

    specs: list[str] = []
    prose_parts: list[str] = []
    explicit_names: list[str] = []
    after_product_line = False
    pending_bullet = False
    variant_lines: list[str] = []

    bullet_only = {"⁻", "-", "–", "—", "\u207b", "\u2212"}

    for line in lines:
        if line in bullet_only:
            pending_bullet = True
            after_product_line = False
            continue

        if pending_bullet:
            spec = line.rstrip(";").strip()
            if spec and spec not in specs:
                specs.append(spec)
            pending_bullet = False
            after_product_line = False
            continue

        if PRODUCT_LINE.match(line):
            after_product_line = True
            continue

        if is_spec_line(line):
            spec = clean_spec(line).rstrip(";").strip()
            if spec and spec not in specs:
                specs.append(spec)
            after_product_line = False
            continue

        if is_table_variant_line(line):
            variant_lines.append(line)
            after_product_line = False
            continue

        if after_product_line and looks_like_product_name(line):
            explicit_names.append(line)
            after_product_line = False
            continue

        if looks_like_product_name(line) and not re.search(
            r"\b(for|with|that|which|provides|ensuring)\b", line.lower()
        ):
            if len(line.split()) <= 10 and page_num not in {4, 5, 6}:
                explicit_names.append(line)
                after_product_line = False
                continue

        if len(line) >= 20 or re.search(r"[.!?]", line) or re.search(
            r"\b(for|with|designed|system)\b", line.lower()
        ):
            prose_parts.append(line)
            after_product_line = False
        elif line.endswith(";") and not looks_like_product_name(line):
            spec = line.rstrip(";").strip()
            if spec and spec not in specs:
                specs.append(spec)

    description = re.sub(r"\s+", " ", " ".join(prose_parts)).strip()
    if description.startswith("(") and len(description) < 40:
        description = ""

    name = choose_name(page_num, explicit_names, description)

    if variant_lines and page_num in {5, 6}:
        for variant in variant_lines:
            cleaned = re.sub(r"\s+", " ", variant)
            if cleaned and cleaned not in specs:
                specs.append(cleaned)

    if not name and not description and not specs:
        return None

    if not name:
        name = PAGE_NAME_FALLBACK.get(page_num, f"Product (page {page_num})")

    return {
        "name": name,
        "description": description,
        "specs": specs,
        "pages": [page_num],
    }


def merge_products(products: list[dict]) -> list[dict]:
    merged: list[dict] = []
    for product in products:
        if merged and merged[-1]["name"] == product["name"]:
            prev = merged[-1]
            prev["pages"].extend(product["pages"])
            if product["description"] and product["description"] not in prev["description"]:
                prev["description"] = (prev["description"] + " " + product["description"]).strip()
            for spec in product["specs"]:
                if spec not in prev["specs"]:
                    prev["specs"].append(spec)
        else:
            merged.append(product)
    return merged


def build_page_slug_map(products: list[dict]) -> dict[int, str]:
    page_slug: dict[int, str] = {}
    for product in products:
        slug = slugify(product["name"])
        for page in product["pages"]:
            page_slug[page] = slug
    return page_slug


def extract_images(doc: fitz.Document, page_slug: dict[int, str]) -> dict[int, list[dict]]:
    seen: set[str] = set()
    by_page: dict[int, list[dict]] = {}

    for page_index in range(len(doc)):
        page_num = page_index + 1
        page = doc[page_index]
        slug = page_slug.get(page_num, "page")
        folder_name = f"p{page_num:02d}-{slug}"
        folder = IMAGES_DIR / folder_name
        folder.mkdir(parents=True, exist_ok=True)
        page_images: list[dict] = []

        for img_info in page.get_images(full=True):
            xref = img_info[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue

            w = base.get("width", 0)
            h = base.get("height", 0)
            if w < MIN_IMAGE or h < MIN_IMAGE:
                continue

            data = base["image"]
            digest = hashlib.sha256(data).hexdigest()[:12]
            if digest in seen:
                continue
            seen.add(digest)

            ext = base.get("ext", "png")
            filename = f"p{page_num:02d}-img-{len(page_images) + 1:02d}.{ext}"
            filepath = folder / filename
            filepath.write_bytes(data)

            rel = f"images/{folder_name}/{filename}"
            page_images.append({
                "path": rel,
                "width": w,
                "height": h,
                "area": w * h,
                "page": page_num,
            })

        page_images.sort(key=lambda x: x["area"], reverse=True)
        if page_images:
            by_page[page_num] = page_images

    return by_page


def attach_images(products: list[dict], by_page: dict[int, list[dict]]) -> None:
    for product in products:
        images: list[str] = []
        seen_paths: set[str] = set()
        for page in product["pages"]:
            for img in by_page.get(page, []):
                path = img["path"]
                if path not in seen_paths:
                    seen_paths.add(path)
                    images.append(path)
        product["images"] = images


def format_page_range(pages: list[int]) -> str:
    if not pages:
        return ""
    if len(pages) == 1:
        return str(pages[0])
    return f"{pages[0]}–{pages[-1]}"


def write_readme(products: list[dict], page_count: int) -> None:
    lines = [
        "# Astrolabe Medical Products Catalogue",
        "",
        f"Extracted from `{PDF_PATH.name}` ({page_count} pages).",
        "",
        f"**Products:** {len(products)}",
        "",
        "---",
        "",
    ]

    for product in products:
        pages = format_page_range(product["pages"])
        lines.append(f"## {product['name']}")
        lines.append(f"**Pages:** {pages}")
        lines.append("")

        lines.append("### Description")
        lines.append("")
        lines.append(product["description"] or "_No description extracted._")
        lines.append("")

        lines.append("### Specs")
        lines.append("")
        if product["specs"]:
            for spec in product["specs"]:
                lines.append(f"- {spec}")
        else:
            lines.append("_No bullet specs on source page(s)._")
        lines.append("")

        lines.append("### Images")
        lines.append("")
        if product["images"]:
            for img_path in product["images"]:
                alt = product["name"].replace("]", "")
                lines.append(f"- ![{alt}]({img_path})")
        else:
            lines.append("_No images extracted for this product's page(s)._")
        lines.append("")
        lines.append("---")
        lines.append("")

    README_PATH.write_text("\n".join(lines), encoding="utf-8")


def write_source(page_count: int, product_count: int, image_count: int) -> None:
    SOURCE_PATH.write_text(
        "\n".join([
            "Astrolabe Medical Products — extraction source",
            "",
            f"PDF: {PDF_PATH.relative_to(ROOT)}",
            f"Pages: {page_count}",
            f"Product pages parsed: {PRODUCT_PAGE_START}–{PRODUCT_PAGE_END}",
            f"Products extracted: {product_count}",
            f"Images extracted: {image_count}",
            f"Extraction date: {date.today().isoformat()}",
            "Script: scripts/extract_astrolabe_catalog.py",
        ]),
        encoding="utf-8",
    )


def main() -> int:
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if IMAGES_DIR.exists():
        import shutil
        shutil.rmtree(IMAGES_DIR)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    page_count = len(doc)
    print(f"Opened {PDF_PATH.name} ({page_count} pages)")

    print("Parsing product text…")
    raw_products: list[dict] = []
    for page_num in range(PRODUCT_PAGE_START, PRODUCT_PAGE_END + 1):
        if page_num > page_count:
            break
        raw = doc[page_num - 1].get_text()
        parsed = parse_page(page_num, raw)
        if parsed:
            raw_products.append(parsed)
        elif page_num in PAGE_NAME_FALLBACK:
            raw_products.append({
                "name": PAGE_NAME_FALLBACK[page_num],
                "description": "",
                "specs": [],
                "pages": [page_num],
            })

    products = merge_products(raw_products)
    page_slug = build_page_slug_map(products)

    print("Extracting images…")
    by_page = extract_images(doc, page_slug)
    total_images = sum(len(v) for v in by_page.values())
    print(f"  {total_images} images across {len(by_page)} pages")

    doc.close()

    attach_images(products, by_page)

    write_readme(products, page_count)
    PRODUCTS_JSON_PATH.write_text(
        json.dumps(products, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    write_source(page_count, len(products), total_images)

    print(f"\nWrote {OUT_DIR.relative_to(ROOT)}/")
    print(f"  README.md — {len(products)} products")
    print("  products.json")
    print(f"  images/ — {total_images} files")
    print("  SOURCE.txt")

    print("\nSample products:")
    for p in products[:5]:
        label = p["name"].encode("ascii", "replace").decode("ascii")
        print(
            f"  - {label} (p.{format_page_range(p['pages'])}) "
            f"- {len(p['images'])} images, {len(p['specs'])} specs"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
