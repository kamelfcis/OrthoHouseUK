#!/usr/bin/env python3
"""
Extract product text and images from Orthosintex Episcan Foot and Ankle 2025.pdf.
Outputs Orthosintex-Episcan-Foot-Ankle-2025/ with README.md, products.json, images/, SOURCE.txt.
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
PDF_PATH = ROOT / "Orthosintex Episcan Foot and Ankle 2025.pdf"
OUT_DIR = ROOT / "Orthosintex-Episcan-Foot-Ankle-2025"
IMAGES_DIR = OUT_DIR / "images"
README_PATH = OUT_DIR / "README.md"
PRODUCTS_JSON_PATH = OUT_DIR / "products.json"
SOURCE_PATH = OUT_DIR / "SOURCE.txt"

MIN_IMAGE = 200
# Screw / implant photos are often wide but short (e.g. 800×150); keep those
# while still rejecting tiny icons and hairline table rules.
MIN_SHORT_SIDE = 100
PRODUCT_PAGE_START = 4
PRODUCT_PAGE_END = 27

PAGE_NUM = re.compile(r"^\s*\d+/\d+\s*$")
CHECKMARK = re.compile(r"^[\uF0FC\u2713\u2714\u2611\uF0FE]\s*")
CHECKMARK_INLINE = re.compile(r"[\uF0FC\u2713\u2714\u2611\uF0FE]\s*")

PART_CODE = r"\d{3}-\d{3,4}[Xx]?"
PRODUCT_FULL = re.compile(
    rf"^({PART_CODE}(?:\s*/\s*{PART_CODE})?)\s*[-–—]\s*(.+)$"
)
PRODUCT_CODE = re.compile(rf"^({PART_CODE}(?:\s*/\s*{PART_CODE})?)\s*$")
TABLE_PRODUCT = re.compile(
    rf"^({PART_CODE})\s*[-–—]\s*([\d,.Øø]+\s*/?\s*[\d,.Øø]*\s*MM)\s*$",
    re.I,
)
WILDCARD_PRODUCT = re.compile(r"^(\d{3}-XXXX(?:-\d{3})?)\s*[-–—]\s*(.+)$", re.I)
GENERIC_WILDCARD = re.compile(r"^(\d{3}-XXXX)\s*[-–—]\s*(.+)$", re.I)
REAMER_CODE = re.compile(r"^(123-\d{4}-\d{3})$")
VARIANT_REF = re.compile(r"^(?:201|202|204|205|206|215|220|233|234)-\d{4}-\d{3}$")
KIT_REF = re.compile(r"^940-\d{4}-\d{3}$")
KIT_CODE = re.compile(r"^(940-\d{4}-\d{3})\s+(.+)$")

FAMILY_HEADING = re.compile(
    r"(?:SYSTEM\s+Ø|SYSTEM\s+ø|DOUBLE THREAD|O-PROG|STAPLES|FLAT FOOT|"
    r"CANNULATED|REMOVAL SYSTEM|ORTHO-MIS|VITI SNAP|FOOT MINI-INVASIVE|"
    r"CANCELLOUS CANNULATED|TECHNICAL\s+DATA)",
    re.I,
)

SECTION_HEADING = re.compile(
    r"^(?:Surgical Indications|SURGICAL INDICATIONS|TECHNICAL\s+DATA\s+SHEET|"
    r"INDEX|Description|Page|CE Certficate|REF|Size|Length|Code|"
    r"Plates Straight|T Plates|Spacer|Wedge|Holes|Sizes|Step|Wedge / Length|"
    r"Holes / Length|Asiymmetical|Symmetical|Straigth Plates|Mod\. R|"
    r"Thread \d+mm|Total Thread|Helical|Conical|Cylindrical|Oval|4 Section|"
    r"VITI A FILETTATURA|REVISION PLATES|"
    r"CALCANEUS FRACTURES|CALCANEAL DISPLACEMENT|DIABETIC FOOT|"
    r"PLATES PER PIEDE|"
    r"DOUBLE THREAD SCREWS|O-PROG|STAPLES|FLAT FOOT CORRECTION|"
    r"CANNULATED SCREWS|REMOVAL SYSTEM|ORTHO-MIS|FOOT MINI-INVASIVE|"
    r"CALCANEAL OSTEOTOMY|VCP PLATE|PLATES PER PIEDE|VITI SNAP-OFF|"
    r"TALAR SCREWS|XCALC CALCANEAL|ENDORTESI XTALUS|ESO-ENDOORTESI)\b",
    re.I,
)

SPEC_LINE = re.compile(
    r"^(Raw material|Thickness|Length|Spacer|Wedge|Holes|Sizes|Size|Warp|Step|"
    r"Code|Tipologia|Section|Angle|Wire Guide|Head|Ø distal/proximal|"
    r"Ø Thread|Ø Head|Screw head|Ø)\s*:?\s*(.*)$",
    re.I,
)

SKIP_LINE_PATTERNS = [
    re.compile(r"^OXT_piede", re.I),
    re.compile(r"^ORTHO HOUSE", re.I),
    re.compile(r"^Exclusive distributor", re.I),
    re.compile(r"^United Kingdom", re.I),
    re.compile(r"^London,", re.I),
    re.compile(r"^6th Floor", re.I),
    re.compile(r"^\* ", re.I),
    re.compile(r"^Note:", re.I),
    re.compile(r"^REF$", re.I),
    re.compile(r"^Ref$", re.I),
    re.compile(r"^Description$", re.I),
    re.compile(r"^\d+\s*mm\s*$", re.I),
    re.compile(r"^\d+mm\s*$", re.I),
    re.compile(r"^\d+\s*H\.", re.I),
    re.compile(r"^[TL]\s", re.I),
    re.compile(r"^[SR]h\s", re.I),
    re.compile(r"^[LM]\s", re.I),
    re.compile(r"^Lh\s", re.I),
    re.compile(r"^XS\b", re.I),
    re.compile(r"^XL\b", re.I),
    re.compile(r"^\d+\s*Holes", re.I),
    re.compile(r"^Plates\b", re.I),
    re.compile(r"^T\s+\d", re.I),
    re.compile(r"^\d+\s*Holes\s+L\.", re.I),
    re.compile(r"^\d+x\d+mm$", re.I),
    re.compile(r"^8x8mm$", re.I),
    re.compile(r"^10x10mm$", re.I),
    re.compile(r"^12x10mm$", re.I),
    re.compile(r"^10x8mm$", re.I),
    re.compile(r"^8x10mm$", re.I),
    re.compile(r"^L\.$", re.I),
    re.compile(r"^-$", re.I),
    re.compile(r"^\d+$", re.I),
]

TABLE_HEADER_WORDS = {
    "length", "ref", "sizes", "size", "wedge", "spacer", "step", "holes",
    "asiymmetical", "symmetical", "code", "description", "ø 2,0mm", "ø 2,5mm",
    "ø 2,7mm", "ø 3,0mm", "ø 2,7mm", "ø 3,0mm", "ø 3,5mm", "ø 4,0mm", "ø 4,5mm",
}

# Footer diameter callouts on Double Thread Screws pages (not surgical indications)
DIAMETER_LEGEND = re.compile(
    r"^[Øø]\s*[\d,.]+\s*mm(?:\s+[Øø]\s*[\d,.]+\s*mm)+\s*$",
    re.I,
)


def slugify(text: str, max_len: int = 48) -> str:
    text = text.lower().strip()
    text = text.replace("ø", "o").replace("Ø", "o")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:max_len] or "product"


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def should_skip_line(line: str) -> bool:
    if not line or PAGE_NUM.match(line):
        return True
    if VARIANT_REF.match(line):
        return True
    if DIAMETER_LEGEND.match(line):
        return True
    if line.lower() in TABLE_HEADER_WORDS:
        return True
    if re.match(r"^\d{1,3}\s*mm\s+\d{3}-\d{4}-\d{3}", line, re.I):
        return True
    if re.match(r"^\d+\s+\d{3}-\d{4}-\d{3}", line):
        return True
    if re.match(r"^\d{3}-\d{4}-\d{3}\s+\d{3}-\d{4}-\d{3}", line):
        return True
    return any(p.match(line) for p in SKIP_LINE_PATTERNS)


def is_title_line(line: str, pending_code: bool = False) -> bool:
    if len(line) < 4 or len(line) > 90:
        return False
    if SPEC_LINE.match(line) or PRODUCT_FULL.match(line) or PRODUCT_CODE.match(line):
        return False
    if not pending_code and (SECTION_HEADING.match(line) or FAMILY_HEADING.search(line)):
        return False
    if re.search(r"[a-z]{4,}", line) and not re.search(r"\bmm\b", line, re.I):
        return False
    upper_ratio = sum(1 for c in line if c.isupper()) / max(len(line.replace(" ", "")), 1)
    return upper_ratio > 0.5 or line.isupper()


def parse_product_name(code: str, title: str) -> str:
    code = re.sub(r"\s+", " ", code.strip())
    title = re.sub(r"\s+", " ", title.strip(" -–—"))
    return f"{code} - {title}"


def finalize_product(
    product: dict | None,
    page_num: int,
    family: str,
) -> dict | None:
    if not product:
        return None
    if not product.get("name"):
        return None
    if family and not product.get("description"):
        product["description"] = family
    elif family and family not in product.get("description", ""):
        desc = product.get("description", "")
        if desc:
            product["description"] = f"{family}. {desc}"
        else:
            product["description"] = family
    product["pages"] = sorted(set(product.get("pages", []) + [page_num]))
    product["specs"] = list(dict.fromkeys(product.get("specs", [])))
    return product


def new_product(name: str, page_num: int, family: str) -> dict:
    return {
        "name": name,
        "description": family or "",
        "specs": [],
        "pages": [page_num],
    }


def parse_page(page_num: int, raw: str) -> list[dict]:
    lines = [clean_line(l) for l in raw.splitlines()]
    lines = [l for l in lines if l and not should_skip_line(l)]

    family = ""
    products: list[dict] = []
    current: dict | None = None
    mode: str | None = None
    pending_code: str | None = None
    pending_reamer: dict | None = None
    removal_mode = False

    pending_kit: str | None = None

    def flush_current() -> None:
        nonlocal current
        finalized = finalize_product(current, page_num, family)
        if finalized:
            products.append(finalized)
        current = None

    def start_product(name: str) -> None:
        nonlocal current
        flush_current()
        current = new_product(name, page_num, family)

    def add_spec(text: str) -> None:
        if not current or not text:
            return
        text = text.rstrip(";").strip()
        if text and text not in current["specs"]:
            current["specs"].append(text)

    def add_indication(text: str) -> None:
        text = CHECKMARK_INLINE.sub("", text).strip()
        text = re.sub(r"^[\uF0FC\u2713\u2714\u2611\uF0FE\uF0A0\s]+", "", text).strip()
        if not text or len(text) < 3:
            return
        if re.match(r"^\d{3}-\d", text):
            return
        if DIAMETER_LEGEND.match(text) or re.match(r"^[Øø]\s*[\d,.]+\s*mm\s*$", text, re.I):
            return
        target = current or (products[-1] if products else None)
        if not target:
            return
        # Join wrapped indication lines (e.g. osteotomy lists ending in comma)
        if target["specs"]:
            prev = target["specs"][-1]
            if prev.startswith("Indication: ") and prev.rstrip().endswith(","):
                joined = f"{prev} {text}"
                if joined not in target["specs"]:
                    target["specs"][-1] = joined
                return
        label = f"Indication: {text}"
        if label not in target["specs"]:
            target["specs"].append(label)

    i = 0
    while i < len(lines):
        line = lines[i]

        if FAMILY_HEADING.search(line) and not PRODUCT_FULL.match(line):
            if re.match(r"^REMOVAL SYSTEM", line, re.I):
                removal_mode = True
                start_product("REMOVAL SYSTEM FOR ORTHOPEDIC SCREWS")
                i += 1
                continue
            if re.match(r"^ORTHO-MIS", line, re.I):
                family = "ORTHO-MIS FOOT MINI-INVASIVE SURGERY REAMERS"
                i += 1
                continue
            if not PRODUCT_CODE.match(line) and not WILDCARD_PRODUCT.match(line):
                if "CANCELLOUS CANNULATED" in line.upper():
                    start_product(line.strip())
                    i += 1
                    continue
                if len(line) < 80 and not SPEC_LINE.match(line):
                    family = line
                i += 1
                continue

        if re.match(r"^Surgical Indications?$", line, re.I):
            mode = "indications"
            i += 1
            continue

        if re.match(r"^SURGICAL INDICATIONS$", line, re.I):
            mode = "indications"
            i += 1
            continue

        if re.match(r"^TECHNICAL\s+DATA\s+SHEET", line, re.I):
            mode = "specs"
            i += 1
            continue

        if removal_mode:
            kit = KIT_CODE.match(line)
            if kit:
                add_spec(f"{kit.group(1)} — {kit.group(2)}")
                pending_kit = None
                i += 1
                continue
            if re.match(r"^940-\d{4}-\d{3}$", line):
                pending_kit = line
                i += 1
                continue
            if pending_kit and len(line) > 3 and not re.match(r"^\d{1,2}$", line):
                add_spec(f"{pending_kit} — {line}")
                pending_kit = None
                i += 1
                continue

        m = REAMER_CODE.match(line)
        if m:
            if pending_reamer:
                start_product(f"{pending_reamer['code']} - FOOT MINI-INVASIVE SURGERY REAMER")
                for spec in pending_reamer["specs"]:
                    add_spec(spec)
                pending_reamer = None
            pending_reamer = {"code": m.group(1), "specs": []}
            i += 1
            continue

        m = PRODUCT_FULL.match(line)
        if m:
            if TABLE_PRODUCT.match(line):
                i += 1
                continue
            if re.match(r"^\d{1,4}$", m.group(2).strip()):
                i += 1
                continue
            title = m.group(2).strip()
            # Page 14 lists products before the family banner at the bottom
            if re.search(r"DOUBLE\s+THREAD", title, re.I):
                family = "DOUBLE THREAD SCREWS"
            elif re.search(r"\bO-PROG\b", title, re.I):
                family = "O-PROG"
            name = parse_product_name(m.group(1), title)
            start_product(name)
            mode = None
            pending_code = None
            i += 1
            continue

        m = WILDCARD_PRODUCT.match(line) or GENERIC_WILDCARD.match(line)
        if m:
            name = parse_product_name(m.group(1), m.group(2))
            start_product(name)
            mode = None
            pending_code = None
            i += 1
            continue

        m = PRODUCT_CODE.match(line)
        if m and not VARIANT_REF.match(line):
            pending_code = m.group(1)
            i += 1
            continue

        if pending_code and is_title_line(line, pending_code=True):
            name = parse_product_name(pending_code, line)
            start_product(name)
            pending_code = None
            mode = None
            i += 1
            continue

        if pending_reamer:
            if re.match(r"^(Helical|Conical|Cylindrical|Oval|4 Section)", line, re.I):
                pending_reamer["specs"].append(line)
                i += 1
                continue
            if re.match(r"^[Øø]\s", line) or re.match(r"^L\.\s", line, re.I):
                pending_reamer["specs"].append(line)
                i += 1
                continue
            if SPEC_LINE.match(line):
                pending_reamer["specs"].append(line)
                i += 1
                continue
            if re.match(r"^Surgical Indications", line, re.I):
                start_product(f"{pending_reamer['code']} - FOOT MINI-INVASIVE SURGERY REAMER")
                for spec in pending_reamer["specs"]:
                    add_spec(spec)
                pending_reamer = None
                mode = "indications"
                i += 1
                continue
            name = f"{pending_reamer['code']} - FOOT MINI-INVASIVE SURGERY REAMER"
            start_product(name)
            for spec in pending_reamer["specs"]:
                add_spec(spec)
            pending_reamer = None
            if not CHECKMARK.match(line) and not SPEC_LINE.match(line):
                i += 1
                continue

        if CHECKMARK.match(line) or (mode == "indications" and not SECTION_HEADING.match(line)):
            add_indication(CHECKMARK_INLINE.sub("", line).strip())
            i += 1
            continue

        spec = SPEC_LINE.match(line)
        if spec:
            key = spec.group(1).strip()
            val = spec.group(2).strip()
            if val:
                add_spec(f"{key}: {val}")
            else:
                if i + 1 < len(lines) and not should_skip_line(lines[i + 1]):
                    nxt = lines[i + 1]
                    if not SPEC_LINE.match(nxt) and not PRODUCT_FULL.match(nxt):
                        add_spec(f"{key}: {nxt}")
                        i += 2
                        continue
            mode = "specs"
            i += 1
            continue

        if current and current["specs"] and re.match(r"^ISO\s+\d", line, re.I):
            current["specs"][-1] = f"{current['specs'][-1]} {line}"
            i += 1
            continue

        if current and current["specs"] and re.match(r"^\d{4}\.\d", line):
            current["specs"][-1] = f"{current['specs'][-1]} {line}"
            i += 1
            continue

        if mode == "indications":
            if len(line) > 8 and not SECTION_HEADING.match(line):
                add_indication(line)
            i += 1
            continue

        if re.match(r"^CANCELLOUS CANNULATED SCREWS", line, re.I):
            start_product(line.strip())
            mode = None
            i += 1
            continue

        if pending_code:
            pending_code = None

        i += 1

    if pending_reamer:
        start_product(f"{pending_reamer['code']} - FOOT MINI-INVASIVE SURGERY REAMER")
        for spec in pending_reamer["specs"]:
            add_spec(spec)

    flush_current()

    if page_num == 10:
        vcp_name = "215-3505 - CALCANEAL OSTEOTOMY VCP PLATE"
        vcp_specs: list[str] = []
        vcp_inds: list[str] = []
        for line in lines:
            spec = SPEC_LINE.match(line)
            if spec:
                key, val = spec.group(1).strip(), spec.group(2).strip()
                if val:
                    vcp_specs.append(f"{key}: {val}")
            if CHECKMARK_INLINE.search(line):
                ind = CHECKMARK_INLINE.sub("", line).strip()
                if ind and len(ind) > 3:
                    vcp_inds.append(f"Indication: {ind}")
        if vcp_specs or vcp_inds:
            vcp_target = next((p for p in products if "VCP" in p["name"].upper()), None)
            if vcp_target:
                for s in vcp_specs + vcp_inds:
                    if s not in vcp_target["specs"]:
                        vcp_target["specs"].append(s)
                if not vcp_target.get("description"):
                    vcp_target["description"] = "REARFOOT PLATES SYSTEM Ø 4,0mm"
            else:
                vcp = new_product(vcp_name, page_num, "REARFOOT PLATES SYSTEM Ø 4,0mm")
                vcp["specs"] = vcp_specs + vcp_inds
                products.insert(0, finalize_product(vcp, page_num, vcp["description"]) or vcp)

    if page_num in {24, 25}:
        target = next((p for p in products if "CANCELLOUS CANNULATED" in p["name"].upper()), None)
        if target:
            for line in lines:
                spec = SPEC_LINE.match(line)
                if spec:
                    key, val = spec.group(1).strip(), spec.group(2).strip()
                    entry = f"{key}: {val}" if val else key
                    if entry not in target["specs"]:
                        target["specs"].append(entry)
                if re.match(r"^Fractures and correction", line, re.I):
                    ind = f"Indication: {line.strip()}"
                    if ind not in target["specs"]:
                        target["specs"].append(ind)
            if target.get("description") in {"", "TECHNICAL DATA SHEET"}:
                target["description"] = "CANNULATED SCREWS"

    if page_num == 26 and not products:
        products.append(
            finalize_product(
                new_product("REMOVAL SYSTEM FOR ORTHOPEDIC SCREWS", page_num, ""),
                page_num,
                "",
            )
            or new_product("REMOVAL SYSTEM FOR ORTHOPEDIC SCREWS", page_num, "")
        )

    return [p for p in products if p and p.get("name")]


def product_base_code(name: str) -> str | None:
    m = re.match(r"^(123-\d{4}-\d{3})", name, re.I)
    if m:
        return m.group(1).upper()
    m = re.match(rf"^({PART_CODE})", name, re.I)
    return m.group(1).upper() if m else None


def merge_products(products: list[dict]) -> list[dict]:
    merged: list[dict] = []
    index: dict[str, int] = {}

    for product in products:
        key = product_base_code(product["name"]) or product["name"].upper()
        if key in index:
            prev = merged[index[key]]
            if len(product["name"]) > len(prev["name"]):
                prev["name"] = product["name"]
            prev["pages"] = sorted(set(prev["pages"] + product["pages"]))
            if product["description"] and product["description"] not in prev["description"]:
                if prev["description"]:
                    prev["description"] = f"{prev['description']} {product['description']}".strip()
                else:
                    prev["description"] = product["description"]
            for spec in product["specs"]:
                if spec not in prev["specs"]:
                    prev["specs"].append(spec)
        else:
            index[key] = len(merged)
            merged.append(product)

    return merged


def build_page_slug_map(products: list[dict]) -> dict[int, str]:
    """Staging folder slug per page (final per-product folders are set after attach)."""
    page_slug: dict[int, str] = {}
    for page in range(PRODUCT_PAGE_START, PRODUCT_PAGE_END + 1):
        page_slug[page] = "page"
    return page_slug


def relocate_images_to_product_folders(products: list[dict]) -> None:
    """Move each assigned image into a folder named after its product (1 image → 1 folder)."""
    import shutil

    kept: set[Path] = set()
    for product in products:
        imgs = product.get("images") or []
        if not imgs:
            continue
        page = min(product["pages"])
        slug = slugify(product["name"])
        folder_name = f"p{page:02d}-{slug}"
        dest_dir = IMAGES_DIR / folder_name
        dest_dir.mkdir(parents=True, exist_ok=True)
        new_paths: list[str] = []
        for i, rel in enumerate(imgs):
            src = OUT_DIR / rel
            if not src.exists():
                continue
            filename = f"p{page:02d}-img-{i + 1:02d}{src.suffix}"
            dest = dest_dir / filename
            if src.resolve() != dest.resolve():
                if dest.exists():
                    dest.unlink()
                shutil.move(str(src), str(dest))
            new_paths.append(f"images/{folder_name}/{filename}")
            kept.add(dest.resolve())
        product["images"] = new_paths

    # Remove unused staging images/folders (page-level extracts not assigned to a product)
    if IMAGES_DIR.exists():
        for folder in list(IMAGES_DIR.iterdir()):
            if not folder.is_dir():
                continue
            for f in list(folder.iterdir()):
                if f.is_file() and f.resolve() not in kept:
                    f.unlink()
            if not any(folder.iterdir()):
                folder.rmdir()


def image_passes_size(w: int, h: int) -> bool:
    """Keep square product photos and wide/tall implant photos; drop icons/rules."""
    if min(w, h) < 20:
        return False
    if w >= MIN_IMAGE and h >= MIN_IMAGE:
        return True
    # Landscape or portrait product photos (e.g. Double Thread Screws ~800×150)
    return max(w, h) >= MIN_IMAGE and min(w, h) >= MIN_SHORT_SIDE


def primary_image_rect(rects: list) -> fitz.Rect | None:
    if not rects:
        return None
    return max(rects, key=lambda r: abs(r.width * r.height))


def is_decorative_placement(rect: fitz.Rect | None, page_rect: fitz.Rect, n_rects: int) -> bool:
    """Skip tiled backgrounds, footers, and full-width thin certificate strips."""
    if n_rects >= 4:
        return True
    if rect is None:
        return False
    page_h = page_rect.height
    page_w = page_rect.width
    # Shared Orthosintex footer logo / page banner
    if rect.y0 > page_h * 0.88:
        return True
    # Full-width thin strips (CE certificate page slices, etc.)
    if rect.width > page_w * 0.85 and rect.height < 50:
        return True
    # Extremely thin display (vector-ish slices)
    if rect.height < 15 or rect.width < 15:
        return True
    return False


def extract_images(doc: fitz.Document, page_slug: dict[int, str]) -> dict[int, list[dict]]:
    seen: set[str] = set()
    by_page: dict[int, list[dict]] = {}

    for page_index in range(len(doc)):
        page_num = page_index + 1
        page = doc[page_index]
        page_rect = page.rect
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
            if not image_passes_size(w, h):
                continue

            rects = page.get_image_rects(xref)
            rect = primary_image_rect(list(rects))
            if is_decorative_placement(rect, page_rect, len(rects)):
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
                "cx": (rect.x0 + rect.x1) / 2 if rect else page_rect.width / 2,
                "cy": (rect.y0 + rect.y1) / 2 if rect else page_rect.height / 2,
                "bbox": [rect.x0, rect.y0, rect.x1, rect.y1] if rect else None,
            })

        page_images.sort(key=lambda x: x["area"], reverse=True)
        if page_images:
            by_page[page_num] = page_images

    return by_page


def find_code_anchor(page: fitz.Page, code: str) -> tuple[float, float] | None:
    """Return center of the first title-like occurrence of a product code on the page."""
    code_u = code.upper()
    best: tuple[float, float, float] | None = None  # (y, cx, cy) prefer topmost title
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(span.get("text", "") for span in line.get("spans", []))
            if code_u not in text.upper():
                continue
            # Prefer lines that look like product titles, not table variant refs
            if re.search(rf"{re.escape(code)}\s*-\d{{3}}\b", text, re.I):
                continue
            bbox = line["bbox"]
            cx = (bbox[0] + bbox[2]) / 2
            cy = (bbox[1] + bbox[3]) / 2
            if best is None or cy < best[0]:
                best = (cy, cx, cy)
    if best is None:
        return None
    return best[1], best[2]


def attach_images(
    products: list[dict],
    by_page: dict[int, list[dict]],
    doc: fitz.Document | None = None,
) -> None:
    """Attach images to products; on multi-product pages, assign by spatial proximity."""
    # Group products by page for spatial assignment
    page_products: dict[int, list[dict]] = {}
    for product in products:
        product["images"] = []
        for page in product["pages"]:
            page_products.setdefault(page, []).append(product)

    assigned_paths: dict[int, set[str]] = {}  # page -> paths claimed by spatial assign

    for page_num, page_prods in page_products.items():
        imgs = by_page.get(page_num, [])
        if not imgs:
            continue

        # Single product on page: keep previous behavior (all page images)
        if len(page_prods) == 1 or doc is None:
            for product in page_prods:
                for img in imgs:
                    if img["path"] not in product["images"]:
                        product["images"].append(img["path"])
            continue

        page = doc[page_num - 1]
        anchors: list[tuple[dict, float, float]] = []
        for product in page_prods:
            code = product_base_code(product["name"])
            if not code:
                continue
            anchor = find_code_anchor(page, code)
            if anchor:
                anchors.append((product, anchor[0], anchor[1]))

        if len(anchors) < 2:
            for product in page_prods:
                for img in imgs:
                    if img["path"] not in product["images"]:
                        product["images"].append(img["path"])
            continue

        # Greedy nearest: each image -> closest product title; one image per product preferred
        claimed: set[str] = set()
        pairs: list[tuple[float, dict, dict]] = []  # dist, product, img
        for product, ax, ay in anchors:
            for img in imgs:
                dx = img["cx"] - ax
                dy = img["cy"] - ay
                dist = (dx * dx + dy * dy) ** 0.5
                pairs.append((dist, product, img))
        pairs.sort(key=lambda t: t[0])

        product_got: set[int] = set()
        for dist, product, img in pairs:
            pid = id(product)
            path = img["path"]
            if path in claimed:
                continue
            # Prefer exclusive 1:1 first pass
            if pid in product_got:
                continue
            product["images"].append(path)
            claimed.add(path)
            product_got.add(pid)

        # If some products still empty, give nearest unclaimed image
        for product, ax, ay in anchors:
            if product["images"]:
                continue
            best_img = None
            best_d = float("inf")
            for img in imgs:
                if img["path"] in claimed:
                    continue
                dx = img["cx"] - ax
                dy = img["cy"] - ay
                dist = (dx * dx + dy * dy) ** 0.5
                if dist < best_d:
                    best_d = dist
                    best_img = img
            if best_img:
                product["images"].append(best_img["path"])
                claimed.add(best_img["path"])

        assigned_paths[page_num] = claimed

    # Deduplicate image lists while preserving order
    for product in products:
        product["images"] = list(dict.fromkeys(product["images"]))


def format_page_range(pages: list[int]) -> str:
    if not pages:
        return ""
    if len(pages) == 1:
        return str(pages[0])
    return f"{pages[0]}–{pages[-1]}"


def write_readme(products: list[dict], page_count: int) -> None:
    lines = [
        "# Orthosintex Episcan Foot and Ankle 2025 Catalogue",
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
            "Orthosintex Episcan Foot and Ankle 2025 — extraction source",
            "",
            f"PDF: {PDF_PATH.relative_to(ROOT)}",
            f"Pages: {page_count}",
            f"Product pages parsed: {PRODUCT_PAGE_START}–{PRODUCT_PAGE_END}",
            f"Products extracted: {product_count}",
            f"Images extracted: {image_count}",
            f"Extraction date: {date.today().isoformat()}",
            "Script: scripts/extract_orthosintex_catalog.py",
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
    skip_pages: set[int] = set()
    for page_num in range(PRODUCT_PAGE_START, PRODUCT_PAGE_END + 1):
        if page_num > page_count or page_num in skip_pages:
            continue
        if page_num == 26 and page_count >= 27:
            raw = doc[25].get_text() + "\n" + doc[26].get_text()
            parsed = parse_page(26, raw)
            for p in parsed:
                p["pages"] = sorted(set(p.get("pages", [26]) + [27]))
            raw_products.extend(parsed)
            skip_pages.add(27)
            continue
        raw = doc[page_num - 1].get_text()
        parsed = parse_page(page_num, raw)
        raw_products.extend(parsed)

    products = merge_products(raw_products)
    page_slug = build_page_slug_map(products)

    print("Extracting images…")
    by_page = extract_images(doc, page_slug)
    total_images = sum(len(v) for v in by_page.values())
    print(f"  {total_images} images across {len(by_page)} pages")

    attach_images(products, by_page, doc)
    relocate_images_to_product_folders(products)
    # Recount after relocate (orphan/decorative staging files may remain unused)
    total_images = sum(len(p["images"]) for p in products)
    doc.close()

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
    for p in products[:8]:
        label = p["name"].encode("ascii", "replace").decode("ascii")
        print(
            f"  - {label} (p.{format_page_range(p['pages'])}) "
            f"- {len(p['images'])} images, {len(p['specs'])} specs"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
