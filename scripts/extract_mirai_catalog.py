#!/usr/bin/env python3
"""
Extract English product/component text and images from the Permedica Mirai
Modular Shoulder System brochure (D042EN Rev.04.0 Brochure Mirai_A4.pdf).

Outputs Permedica-Mirai-Shoulder-System/ with README.md, products.json,
images/, SOURCE.txt.

English-preferring: keeps EN section blocks only; stops before IT/DE/FR/ES.
Image thresholds follow Orthosintex landscape-friendly lesson:
  min(side) >= 100 and max(side) >= 200.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "D042EN Rev.04.0 Brochure Mirai_A4.pdf"
OUT_DIR = ROOT / "Permedica-Mirai-Shoulder-System"
IMAGES_DIR = OUT_DIR / "images"
README_PATH = OUT_DIR / "README.md"
PRODUCTS_JSON_PATH = OUT_DIR / "products.json"
SOURCE_PATH = OUT_DIR / "SOURCE.txt"

MIN_IMAGE = 200
MIN_SHORT_SIDE = 100

# Bullet markers used in EN sections (Ÿ is common in this PDF).
BULLET_CHAR = re.compile(r"^[\u0178Ÿ•●▪◦\-–—]\s*")
NUMBERED_SPEC = re.compile(r"^(\d+)\.\s+(.+)$")
SECTION_MARKER = re.compile(r"^\s*-\s*\d+\s*-\s*$")
SIZE_TOKEN = re.compile(r"^(XS|S|M|L|XL|SIZE|Größe|Taille|TAMAÑO)$", re.I)
DIM_LINE = re.compile(r"^(\d+(?:\.\d+)?\s*mm|ø|Ø|H|CCD|OFFSET)$", re.I)

# Non-English language block starts — stop EN extraction here.
# Compiled with MULTILINE so ^/$ work per line.
NON_EN_START = re.compile(
    r"(?:"
    r"^EIN SYSTEM:|"
    r"^HUMERALER CORE CAGE|"
    r"^GLENOID BASISPLATTE|"
    r"^MATERIALIEN und TECHNOLOGIEN|"
    r"^Die TRASER®-Struktur|"
    r"^ANATOMISCHE KONFIGURATION|"
    r"^ANATOMISCHER HUMERUSKOPF|"
    r"^Größe\b|"
    r"^Hergestellt aus|"
    r"^Kaltverschweissung|"
    r"^Glenoid Basisplatte|"
    r"^\d+\.\s+Glenoid Basisplatte|"
    r"^D\s+und\s+D\s+|"
    r"^INVERSE KONFIGURATION|"
    r"^Mirai® erlaubt|"
    r"^UMSTELLUNG AUF EIN|"
    r"^Humerusschaft|"
    r"^Metaphysäre|"
    r"^TRAUMA KONFIGURATION|"
    r"^REVISION KONFIGURATION|"
    r"^LÖSUNGEN FÜR|"
    r"^3DMirai® Planning ist|"
    r"^CONFIGURATION ANATOMIQUE|"
    r"^CONFIGURATION INVERSE|"
    r"^CONFIGURATION TRAUMA|"
    r"^CONFIGURATION DE RÉVISION|"
    r"^CORE CAGE HUMERAL\b|"
    r"^PLATINE GLENOÏDALE|"
    r"^MATÉRIAUX et TECHNOLOGIES|"
    r"^TETE HUMERALE|"
    r"^La structure TRASER®|"
    r"^La prothèse d'épaule|"
    r"^Mirai® permet|"
    r"^CONFIGURACIÓN ANATÓMICA|"
    r"^CONFIGURACIÓN INVERTIDA|"
    r"^CONFIGURACIÓN TRAUMA|"
    r"^CONFIGURACIÓN DE REVISIÓN|"
    r"^PLATINA GLENOIDAL|"
    r"^MATERIALES y TECNOLOGÍAS|"
    r"^CABEZA HUMERAL|"
    r"^La estructura TRASER®|"
    r"^La prótesis de hombro|"
    r"^Mirai® permite|"
    r"^3DMirai® Planning est|"
    r"^3DMirai® Planning es|"
    r"^Erweiterte zirkuläre|"
    r"^Base d'ellipse|"
    r"^Base de elipse|"
    r"^Sphärische|"
    r"^• Sphärische|"
    r"^• Basis mit|"
    r"^• Base à section|"
    r"^• Base de sección|"
    r"^Metalkragen|"
    r"^Elliptische|"
    r"^Manche métallique|"
    r"^Manguito metálico"
    r")",
    re.I | re.M,
)

# Lines that are clearly non-English even if they slip past block cuts.
NON_EN_LINE = re.compile(
    r"(?:"
    r"[äöüßÄÖÜ]|"
    r"Hergestellt|Kaltverschweissung|Größen|Exzentrisch|Konfiguration|"
    r"Schulter|Komponente|Verbindung|Beschichtung|zementfrei|Zementiert|"
    r"erlaubt die|osseointegrierte|"
    r"Fabriqué|Connexion cône|tailles:|glénoïd|"
    r"Fabricado|Conexión|Conformación|tamaños:|"
    r"concepito|sviluppato|omerale|glenoideo|rivestimento|"
    r"ist eine Plattform|est une plateforme|es una plataforma"
    r")",
    re.I,
)

# Italian-only starters that appear before EN on multilingual pages.
ITALIAN_ONLY = re.compile(
    r"(?:"
    r"1 SISTEMA:|"
    r"CORE CAGE OMERALE|"
    r"BASEPLATE GLENOIDEO|"
    r"MATERIALI e TECNOLOGIE|"
    r"CONFIGURAZIONE ANATOMICA|"
    r"CONFIGURAZIONE INVERSA|"
    r"CONFIGURAZIONE TRAUMA|"
    r"CONFIGURAZIONE REVISION|"
    r"TESTA OMERALE ANATOMICA|"
    r"INSERTO GLENOIDEO ANATOMICO|"
    r"INSERTO OMERALE|"
    r"GLENOSFERA\b|"
    r"CONVERSIONE AD IMPIANTO|"
    r"TESTA OMERALE CTA|"
    r"TRAUMA CORE\s*$|"
    r"La struttura TRASER® consente|"
    r"La protesi di spalla|"
    r"Mirai® offre la possibilità|"
    r"3DMirai® Planning è"
    r")",
    re.I,
)


# Explicit product catalogue: English component / configuration sections.
# en_start: regex marking start of English content for this product.
# en_end: optional extra stop (in addition to NON_EN_START).
# pages: source page numbers (1-based).
PRODUCT_DEFS: list[dict] = [
    {
        "name": "Mirai System Overview — 1 System, Always 2 Possibilities",
        "pages": [3],
        "en_start": r"1 SYSTEM: ALWAYS 2 POSSIBILITIES",
    },
    {
        "name": "Mirai Humeral Core Cage",
        "pages": [4],
        "en_start": r"Made using TRASER® Trabecular Laser Melted",
        "title_hint": r"HUMERAL CORE CAGE",
    },
    {
        "name": "Mirai Glenoid Baseplate",
        "pages": [5],
        "en_start": r"1\.\s+Glenoid Base-?Plate available",
        "title_hint": r"GLENOID BASEPLATE",
    },
    {
        "name": "Mirai Materials and Technologies",
        "pages": [6],
        "en_start": r"MATERIALS and TECHNOLOGIES",
    },
    {
        "name": "Mirai Trabecular Laser Melted Titanium (TRASER)",
        "pages": [7],
        "en_start": r"The TRASER® structure allows",
        "title_hint": r"TRABECULAR LASER MELTED TITANIUM",
    },
    {
        "name": "Mirai Anatomical Configuration",
        "pages": [8, 9],
        "en_start": r"The shoulder prosthesis",
        "en_start_by_page": {
            9: r"1\.\s+Humeral stem",
        },
        "title_hint": r"ANATOMICAL CONFIGURATION",
    },
    {
        "name": "Mirai Anatomic Humeral Head",
        "pages": [10],
        "en_start": r"ANATOMIC HUMERAL HEAD",
    },
    {
        "name": "Mirai Anatomic Glenoid Insert",
        "pages": [11],
        "en_start": r"(?:D\s+and\s+D\s+dimensions of Glenoid|ANATOMIC GLENOID INSERT)",
        "title_hint": r"ANATOMIC GLENOID INSERT",
    },
    {
        "name": "Mirai Reverse Configuration",
        "pages": [12, 13],
        "en_start": r"Mirai® allows conversion",
        "en_start_by_page": {
            13: r"1\.\s+Humeral Stem",
        },
        "title_hint": r"REVERSE CONFIGURATION",
    },
    {
        "name": "Mirai Humeral Insert",
        "pages": [14],
        "en_start": r"•\s*Spherical bearing surface",
        "en_end": r"Spherical concentric Glenosphere",
        "title_hint": r"HUMERAL INSERT",
    },
    {
        "name": "Mirai Glenosphere",
        "pages": [14],
        "en_start": r"Spherical concentric Glenosphere",
        "en_end": r"^HUMERAL INSERT\s*$",
        "title_hint": r"GLENOSPHERE",
    },
    {
        "name": "Mirai Conversion into Stemmed Implant",
        "pages": [15],
        "en_start": r"CONVERSION INTO STEMMED IMPLANT",
    },
    {
        "name": "Mirai Trauma Core",
        "pages": [16],
        "en_start": r"TRAUMA CONFIGURATION",
        "en_end": r"CTA HUMERAL HEAD",
        "title_hint": r"TRAUMA CORE",
    },
    {
        "name": "Mirai CTA Humeral Head",
        "pages": [16],
        "en_start": r"CTA HUMERAL HEAD",
    },
    {
        "name": "Mirai Revision Configuration",
        "pages": [17],
        "en_start": r"REVISION CONFIGURATION",
    },
    {
        "name": "Mirai 3D Planning",
        "pages": [18],
        "en_start": r"3DMirai® Planning is a platform",
        "title_hint": r"3D\s*PLANNING",
    },
]


def slugify(text: str, max_len: int = 48) -> str:
    text = text.lower().strip()
    text = text.replace("ø", "o").replace("Ø", "o")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:max_len] or "product"


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def find_span(text: str, pattern: str) -> re.Match | None:
    return re.search(pattern, text, re.I | re.M)


def extract_english_slice(
    page_text: str,
    en_start: str,
    en_end: str | None = None,
) -> str:
    """Return English-preferring slice starting at en_start until non-EN / en_end."""
    m = find_span(page_text, en_start)
    if not m:
        return ""
    start = m.start()
    rest = page_text[start:]

    stop_at = len(rest)
    # First NON_EN hit after a short minimum (avoid matching title itself)
    for nm in NON_EN_START.finditer(rest):
        if nm.start() > 15:
            stop_at = min(stop_at, nm.start())
            break

    if en_end:
        em = re.search(en_end, rest, re.I | re.M)
        if em and em.start() > 10:
            stop_at = min(stop_at, em.start())

    return rest[:stop_at]


def looks_non_english(line: str) -> bool:
    if NON_EN_LINE.search(line):
        return True
    accented = sum(1 for c in line if ord(c) > 127 and c.isalpha())
    if accented >= 3 and not re.search(r"(TRASER|VITAL|UHMWPE|Ti6Al4V|Mirai)", line):
        return True
    return False


def should_skip_noise(line: str) -> bool:
    if not line:
        return True
    if looks_non_english(line):
        return True
    if SECTION_MARKER.match(line):
        return True
    if SIZE_TOKEN.match(line):
        return True
    if DIM_LINE.match(line):
        return True
    if re.match(r"^\d+(?:\.\d+)?mm$", line, re.I):
        return True
    if re.match(r"^[®©]$", line):
        return True
    if re.match(r"^\d+$", line) and len(line) <= 2:
        return True
    if line in {"DA-P", "DI-S", "RI-S", "RA-P", "DS-I", "TG", "A/P", "S/I", "+", "="}:
        return True
    if ITALIAN_ONLY.match(line) and not re.search(
        r"\b(SYSTEM|BASEPLATE|CONFIGURATION|INSERT|HEAD|CAGE|PLANNING|TRASER)\b",
        line,
        re.I,
    ):
        return True
    return False


def is_english_title_line(line: str, product_name: str) -> bool:
    """Skip repeating the product title as a description line."""
    upper = line.upper().strip()
    name_core = re.sub(r"^MIRAI\s+", "", product_name, flags=re.I).upper()
    if upper == name_core or upper.replace("-", " ") == name_core.replace("-", " "):
        return True
    known = {
        "HUMERAL CORE CAGE",
        "GLENOID BASEPLATE",
        "MATERIALS AND TECHNOLOGIES",
        "TRABECULAR LASER MELTED TITANIUM",
        "ANATOMICAL CONFIGURATION",
        "ANATOMIC HUMERAL HEAD",
        "ANATOMIC GLENOID INSERT",
        "REVERSE CONFIGURATION",
        "HUMERAL INSERT",
        "GLENOSPHERE",
        "CONVERSION INTO STEMMED IMPLANT",
        "TRAUMA CONFIGURATION",
        "TRAUMA CORE",
        "CTA HUMERAL HEAD",
        "REVISION CONFIGURATION",
        "SOLUTION FOR REVISION CASES",
        "1 SYSTEM: ALWAYS 2 POSSIBILITIES",
    }
    return upper in known


def parse_english_block(block: str, product_name: str) -> tuple[str, list[str]]:
    """Parse description prose and bullet/numbered specs from an EN text block."""
    lines = [clean_line(l) for l in block.splitlines()]
    lines = [l for l in lines if l]

    specs: list[str] = []
    prose: list[str] = []
    pending_bullet = False

    def add_spec(text: str) -> None:
        text = re.sub(r"\s+", " ", text).strip(" ;,")
        if not text or looks_non_english(text):
            return
        if len(text) < 3:
            return
        if text not in specs:
            specs.append(text)

    def take_continuations(start: int, first: str) -> tuple[str, int]:
        """Join short wrap-lines that continue a bullet/spec."""
        parts = [first]
        j = start
        while j < len(lines):
            nxt = lines[j]
            if (
                not nxt
                or nxt in {"Ÿ", "•", "●", "-", "–", "—"}
                or BULLET_CHAR.match(nxt)
                or NUMBERED_SPEC.match(nxt)
                or is_english_title_line(nxt, product_name)
                or NON_EN_START.match(nxt)
                or looks_non_english(nxt)
            ):
                break
            if should_skip_noise(nxt) and not re.search(
                r"(mm|Ø|sizes?|offset|coated|HA\b|L\.)", nxt, re.I
            ):
                break
            # New prose sentence → stop continuation
            if (
                len(nxt) >= 60
                and nxt[0].isupper()
                and re.match(
                    r"^(The |Mirai|Unlike|By |Leaving|To deal|Patient |"
                    r"Possibility|In case|In the |Anatomical |Glenoid |"
                    r"Humeral |A further|Long,)",
                    nxt,
                    re.I,
                )
            ):
                break
            if is_english_title_line(nxt, product_name):
                break
            # Keep wrapping short fragments / dimensions
            if len(nxt) <= 90 or re.match(r"^(Ø|L\.|\+|in |with |from |to )", nxt, re.I):
                parts.append(nxt)
                j += 1
                continue
            break
        return " ".join(parts), j

    i = 0
    while i < len(lines):
        line = lines[i]

        if should_skip_noise(line):
            i += 1
            continue

        if is_english_title_line(line, product_name):
            i += 1
            continue

        # Standalone bullet glyph
        if line in {"Ÿ", "•", "●", "-", "–", "—"} or BULLET_CHAR.fullmatch(line):
            pending_bullet = True
            i += 1
            continue

        if pending_bullet:
            body = BULLET_CHAR.sub("", line).strip()
            merged, j = take_continuations(i + 1, body)
            add_spec(merged)
            pending_bullet = False
            i = j
            continue

        if BULLET_CHAR.match(line):
            body = BULLET_CHAR.sub("", line).strip()
            merged, j = take_continuations(i + 1, body)
            add_spec(merged)
            i = j
            continue

        num = NUMBERED_SPEC.match(line)
        if num:
            merged, j = take_continuations(i + 1, num.group(2).strip())
            # Skip empty numbered leftovers like "3." with no body
            if merged and not re.fullmatch(r"\d+\.?", merged):
                add_spec(f"{num.group(1)}. {merged}")
            i = j
            continue

        # Material / manufacturing one-liners → specs
        if re.match(r"^Made using TRASER", line, re.I):
            merged, j = take_continuations(i + 1, line)
            add_spec(merged)
            i = j
            continue

        # Diagram / feature callouts
        if re.match(
            r"^(Hole for|Morse-taper|Metal sleeve|Humeral Head Adapter|"
            r"Non spherical|More circular|More enlonged|same anatomical|"
            r"same shape|same dimensions|Same sizes|Minimal head|"
            r"stemmed|stemless|Safety Screw|Adapter|Spacer|"
            r"Cementless|Cemented|Press-fit|Metaphyseal Humeral|"
            r"Humeral Stem|Humeral Core Cage|Web-based|"
            r"Based on CT|Accurate and|Visualization of|PSI\b|"
            r"Dual radius|Antero-Posterior|Infero-superior|"
            r"Spherical concentric)",
            line,
            re.I,
        ):
            merged, j = take_continuations(i + 1, line)
            add_spec(merged)
            i = j
            continue

        # System overview style "2 Technologies :" headers — keep as structure specs
        if re.match(r"^2\s+\w+", line) and (":" in line or line.endswith(("s", "ns", "ons"))):
            header = line.rstrip(":").strip()
            add_spec(header)
            i += 1
            continue

        # Plain dash list items under overview headers (already handled by BULLET_CHAR for "•")
        if line.startswith("- ") and len(line) < 60:
            add_spec(line[2:].strip())
            i += 1
            continue

        # Prose paragraphs
        if (
            len(line) >= 40
            or re.search(r"[.!?]$", line)
            or re.match(
                r"^(The |Mirai|Unlike|By |Leaving|To deal|Patient |"
                r"Possibility|available in|In case|In the |Anatomical |"
                r"Glenoid |Humeral |A further|Long,|3DMirai|"
                r"with a single|a new solution)",
                line,
                re.I,
            )
        ):
            if not is_english_title_line(line, product_name) and not looks_non_english(line):
                if len(line) >= 20 or re.search(r"[.!?]$", line):
                    prose.append(line)
            i += 1
            continue

        # Short tagline continuations ("that reproduces", "the patient's anatomy")
        if (
            prose
            and len(line) < 40
            and line[0].islower()
            and not BULLET_CHAR.match(line)
            and not NUMBERED_SPEC.match(line)
            and not looks_non_english(line)
        ):
            prose[-1] = f"{prose[-1]} {line}"
            i += 1
            continue

        # Short material / size facts as specs
        if re.search(r"(mm|Ø|VITAL|UHMWPE|Ti6Al4V|sizes?|offset|CCD|HA coating)", line, re.I):
            add_spec(line)
            i += 1
            continue

        i += 1

    description = re.sub(r"\s+", " ", " ".join(prose)).strip()
    description = re.sub(
        r"^(MATERIALS and TECHNOLOGIES|ANATOMICAL CONFIGURATION|"
        r"REVERSE CONFIGURATION|TRAUMA CONFIGURATION|REVISION CONFIGURATION|"
        r"HUMERAL CORE CAGE|GLENOID BASEPLATE|ANATOMIC HUMERAL HEAD|"
        r"ANATOMIC GLENOID INSERT|HUMERAL INSERT|GLENOSPHERE|"
        r"CONVERSION INTO STEMMED IMPLANT|CTA HUMERAL HEAD|"
        r"TRAUMA CORE|SOLUTION FOR REVISION CASES|"
        r"1 SYSTEM: ALWAYS 2 POSSIBILITIES)\s*",
        "",
        description,
        flags=re.I,
    ).strip()
    # Drop trailing numbered callout fragments (revision diagram labels)
    description = re.sub(r"(?:\s*\d+\.\s*[A-Za-z][^.]*){0,8}\s*(?:\d+\.\s*)+$", "", description)
    description = re.sub(r"(?:\s+\d+\.\s*(?:[A-Za-z][\w\s/-]*)?){2,}\s*$", "", description).strip()
    # Drop non-English leftovers that joined into prose
    if looks_non_english(description):
        sentences = re.split(r"(?<=[.!?])\s+", description)
        description = " ".join(s for s in sentences if s and not looks_non_english(s)).strip()
    if len(description) < 25:
        description = ""

    # Drop empty / tiny numbered leftovers from specs
    specs = [
        s for s in specs
        if s
        and not re.fullmatch(r"\d+\.?", s)
        and not re.match(r"^\d+\.\s*$", s)
        and "Humerusschaft" not in s
        and len(s) > 2
    ]

    return description, specs


def parse_product(defn: dict, page_texts: dict[int, str]) -> dict | None:
    pages = defn["pages"]
    name = defn["name"]
    descriptions: list[str] = []
    specs: list[str] = []
    start_by_page: dict[int, str] = defn.get("en_start_by_page", {})

    for page in pages:
        raw = page_texts.get(page, "")
        if not raw:
            continue
        en_start = start_by_page.get(page, defn["en_start"])
        block = extract_english_slice(
            raw,
            en_start,
            defn.get("en_end"),
        )
        if not block and page in start_by_page:
            # Already tried page-specific; nothing else
            continue
        if not block:
            # Try title_hint as alternate start
            hint = defn.get("title_hint")
            if hint:
                block = extract_english_slice(raw, hint, defn.get("en_end"))
        if not block:
            continue
        desc, page_specs = parse_english_block(block, name)
        if desc and desc not in descriptions:
            descriptions.append(desc)
        for s in page_specs:
            if s not in specs:
                specs.append(s)

    description = " ".join(descriptions).strip()
    if not description and not specs:
        return None

    return {
        "name": name,
        "description": description,
        "specs": specs,
        "pages": list(pages),
    }


def image_passes_size(w: int, h: int) -> bool:
    """Keep square photos and wide/tall implant photos; drop icons/rules."""
    if min(w, h) < 20:
        return False
    if w >= MIN_IMAGE and h >= MIN_IMAGE:
        return True
    return max(w, h) >= MIN_IMAGE and min(w, h) >= MIN_SHORT_SIDE


def is_decorative_placement(rect: fitz.Rect | None, page_rect: fitz.Rect, n_rects: int) -> bool:
    if n_rects >= 6:
        return True
    if rect is None:
        return False
    page_h = page_rect.height
    page_w = page_rect.width
    if rect.y0 > page_h * 0.92:
        return True
    if rect.width > page_w * 0.9 and rect.height < 40:
        return True
    if rect.height < 12 or rect.width < 12:
        return True
    return False


def build_page_slug_map(products: list[dict]) -> dict[int, str]:
    page_slug: dict[int, str] = {}
    for product in products:
        slug = slugify(product["name"])
        for page in product["pages"]:
            if page not in page_slug:
                page_slug[page] = slug
    return page_slug


def find_title_anchor(page: fitz.Page, patterns: list[str]) -> tuple[float, float] | None:
    """Center of the first matching English title on the page."""
    best: tuple[float, float, float] | None = None
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(span.get("text", "") for span in line.get("spans", []))
            text_c = clean_line(text)
            if not text_c:
                continue
            for pat in patterns:
                if re.search(pat, text_c, re.I):
                    bbox = line["bbox"]
                    cx = (bbox[0] + bbox[2]) / 2
                    cy = (bbox[1] + bbox[3]) / 2
                    if best is None or cy < best[0]:
                        best = (cy, cx, cy)
                    break
    if best is None:
        return None
    return best[1], best[2]


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

            rects = list(page.get_image_rects(xref))
            rect = max(rects, key=lambda r: abs(r.width * r.height)) if rects else None
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
            })

        page_images.sort(key=lambda x: x["area"], reverse=True)
        if page_images:
            by_page[page_num] = page_images

    return by_page


def attach_images(
    products: list[dict],
    by_page: dict[int, list[dict]],
    doc: fitz.Document,
    defs: list[dict],
) -> None:
    """Attach images; on multi-product pages assign by proximity to EN titles."""
    def_by_name = {d["name"]: d for d in defs}
    page_products: dict[int, list[dict]] = {}
    for product in products:
        product["images"] = []
        for page in product["pages"]:
            page_products.setdefault(page, []).append(product)

    for page_num, page_prods in page_products.items():
        imgs = by_page.get(page_num, [])
        if not imgs:
            continue

        if len(page_prods) == 1:
            for img in imgs:
                page_prods[0]["images"].append(img["path"])
            continue

        page = doc[page_num - 1]
        anchors: list[tuple[dict, float, float]] = []
        for product in page_prods:
            defn = def_by_name.get(product["name"], {})
            patterns = []
            if defn.get("title_hint"):
                patterns.append(defn["title_hint"])
            patterns.append(re.escape(product["name"].replace("Mirai ", "")))
            if defn.get("en_start"):
                # Use a short literal from en_start when it's a title-like string
                start = defn["en_start"]
                if not start.startswith(r"(") and "\\" not in start[:3]:
                    patterns.append(start)
            anchor = find_title_anchor(page, patterns)
            if anchor:
                anchors.append((product, anchor[0], anchor[1]))

        if not anchors:
            # Fallback: share all images across products on the page
            for product in page_prods:
                for img in imgs:
                    if img["path"] not in product["images"]:
                        product["images"].append(img["path"])
            continue

        claimed: set[str] = set()
        for img in imgs:
            best_prod = None
            best_dist = float("inf")
            for product, ax, ay in anchors:
                dist = (img["cx"] - ax) ** 2 + (img["cy"] - ay) ** 2
                if dist < best_dist:
                    best_dist = dist
                    best_prod = product
            if best_prod is not None and img["path"] not in claimed:
                best_prod["images"].append(img["path"])
                claimed.add(img["path"])


def format_page_range(pages: list[int]) -> str:
    if not pages:
        return ""
    if len(pages) == 1:
        return str(pages[0])
    return f"{pages[0]}–{pages[-1]}"


def write_readme(products: list[dict], page_count: int) -> None:
    lines = [
        "# Permedica Mirai Modular Shoulder System Catalogue",
        "",
        f"Extracted from `{PDF_PATH.name}` ({page_count} pages).",
        "",
        "English-language product / component sections only.",
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
            "Permedica Mirai Modular Shoulder System — extraction source",
            "",
            f"PDF: {PDF_PATH.relative_to(ROOT)}",
            f"Pages: {page_count}",
            "Language: English sections only (IT/DE/FR/ES skipped)",
            f"Products extracted: {product_count}",
            f"Images extracted: {image_count}",
            f"Image thresholds: min side >= {MIN_SHORT_SIDE}, max side >= {MIN_IMAGE}",
            f"Extraction date: {date.today().isoformat()}",
            "Script: scripts/extract_mirai_catalog.py",
        ]),
        encoding="utf-8",
    )


def main() -> int:
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}", file=sys.stderr)
        print(
            "Copy 'D042EN Rev.04.0 Brochure Mirai_A4.pdf' into the project root.",
            file=sys.stderr,
        )
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if IMAGES_DIR.exists():
        shutil.rmtree(IMAGES_DIR)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    page_count = len(doc)
    print(f"Opened {PDF_PATH.name} ({page_count} pages)")

    page_texts: dict[int, str] = {}
    for i in range(page_count):
        page_texts[i + 1] = doc[i].get_text()

    print("Parsing English product sections…")
    products: list[dict] = []
    for defn in PRODUCT_DEFS:
        parsed = parse_product(defn, page_texts)
        if parsed:
            products.append(parsed)
        else:
            print(f"  WARN: no EN content for {defn['name']}")

    page_slug = build_page_slug_map(products)

    print("Extracting images…")
    by_page = extract_images(doc, page_slug)
    total_images = sum(len(v) for v in by_page.values())
    print(f"  {total_images} images across {len(by_page)} pages")

    attach_images(products, by_page, doc, PRODUCT_DEFS)
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
    for p in products[:6]:
        label = p["name"].encode("ascii", "replace").decode("ascii")
        print(
            f"  - {label} (p.{format_page_range(p['pages'])}) "
            f"- {len(p['images'])} images, {len(p['specs'])} specs, "
            f"desc={len(p['description'])} chars"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
