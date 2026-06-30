#!/usr/bin/env python3
"""
Extract embedded images from the OrthoHouse recruitment presentation PDF.
Saves to public/assets/presentation/raw/ with page context in filenames.
Skips tiny images (< 200px) that are likely icons or decorations.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "Docs" / "OH presentation for recruitment (1).pdf"
OUT_DIR = ROOT / "public" / "assets" / "presentation" / "raw"
MANIFEST_PATH = ROOT / "scripts" / "tmp" / "pdf_extraction_manifest.json"

MIN_DIMENSION = 200
MIN_WIDTH_QUALITY = 800  # quality gate for editorial use


def slugify(text: str, max_len: int = 48) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:max_len] or "slide"


def page_hint(page: fitz.Page) -> str:
    """Best-effort slide title from first substantial text line."""
    blocks = page.get_text("blocks")
    for block in sorted(blocks, key=lambda b: (b[1], b[0])):
        text = block[4].strip().split("\n")[0].strip()
        if len(text) >= 4 and not text.isdigit():
            return slugify(text)
    return f"page-{page.number + 1:02d}"


def main() -> int:
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_PATH)

    seen_hashes: dict[str, str] = {}
    manifest: list[dict] = []
    extracted = 0
    skipped_small = 0
    skipped_dup = 0

    for page_index in range(len(doc)):
        page = doc[page_index]
        hint = page_hint(page)
        images = page.get_images(full=True)

        for img_index, img_info in enumerate(images):
            xref = img_info[0]
            try:
                base = doc.extract_image(xref)
            except Exception as exc:
                print(f"  skip xref {xref}: {exc}")
                continue

            width = base.get("width", 0)
            height = base.get("height", 0)
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                skipped_small += 1
                continue

            data = base["image"]
            digest = hashlib.sha256(data).hexdigest()[:16]
            if digest in seen_hashes:
                skipped_dup += 1
                continue
            seen_hashes[digest] = digest

            ext = base.get("ext", "png")
            quality_ok = width >= MIN_WIDTH_QUALITY
            filename = f"p{page_index + 1:02d}-{hint}-{img_index + 1:02d}-{width}x{height}.{ext}"
            out_path = OUT_DIR / filename
            out_path.write_bytes(data)
            extracted += 1

            manifest.append(
                {
                    "file": f"presentation/raw/{filename}",
                    "page": page_index + 1,
                    "hint": hint,
                    "width": width,
                    "height": height,
                    "quality_ok": quality_ok,
                    "hash": digest,
                }
            )
            flag = "OK" if quality_ok else "low-res"
            print(f"  [{flag}] {filename}")

    doc.close()

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(
        f"\nDone: {extracted} images, {skipped_small} too small, "
        f"{skipped_dup} duplicates"
    )
    print(f"Manifest: {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
