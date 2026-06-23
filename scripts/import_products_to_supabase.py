#!/usr/bin/env python3
"""Extract products from products.docx and import into Supabase."""
import json
import os
import re
import sys
import time
import zipfile
from pathlib import Path

import requests
from docx import Document
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
DOC_PATH = ROOT / "Docs" / "products.docx"
IMG_DIR = ROOT / "scripts" / "tmp" / "product_images"
OUT_JSON = ROOT / "scripts" / "tmp" / "parsed_products.json"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2
UK_BRANCH_CODE = "UK"

# partner_id: Astrolabe=20, Permedica=10
PARTNERS = {"astrolabe": 20, "permedica": 10, "permedica": 10}
CATEGORIES = {"hand_wrist": 9, "elbow_shoulder": 10, "foot_ankle": 11, "bone_graft": 8}

# Existing DB product_id when known (None = create new)
PRODUCT_DEFS = [
    # Hand / wrist
    {"key": "distal_radius_drp", "names": ["Distal radius plate DRP"], "product_id": 23, "category_id": 9, "partner_id": 20},
    {"key": "volar_e", "names": ["Volar e", "Volar E"], "product_id": 24, "category_id": 9, "partner_id": 20},
    {"key": "combo_hand", "names": ["Combo hand"], "product_id": None, "category_id": 9, "partner_id": 20},
    # Elbow / shoulder
    {"key": "humerus_proximal", "names": ["Humerus proximal", "Humerus Proximal"], "product_id": 21, "category_id": 10, "partner_id": 20},
    {"key": "mirai", "names": ["Mirai system", "MIRAI Modular Shoulder System"], "product_id": 22, "category_id": 10, "partner_id": 10},
    # Foot / ankle - existing
    {"key": "high_tibial_osteotomy", "names": ["High tibial osteotomy"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "episcan_universal_plates", "names": ["Episcan", "universial 4 hole plates", "Universal 4 hole plates"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "tarsal_plate", "names": ["Tarsal plate", "Straight tarsal plate", "Revision plate"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "open_wedge_osteotomy", "names": ["Open-wedge osteotomy", "open-wedge osteotomy"], "product_id": 35, "category_id": 11, "partner_id": 20},
    {"key": "mp_joint_arthrodesis", "names": ["MP-JOINT arthrodesis plates", "MP-joint Arthrodesis Plates"], "product_id": 34, "category_id": 11, "partner_id": 20},
    {"key": "lapidus_plates", "names": ["Plantar Lapidus Plates", "Lapidus Plates", "lapidus plates"], "product_id": 33, "category_id": 11, "partner_id": 20},
    {"key": "cotton_osteotomy", "names": ["Cotton Osteotomy Plates", "Cotton osteotomy plates"], "product_id": 28, "category_id": 11, "partner_id": 20},
    {"key": "snap_off_screw", "names": ["Snap off screw"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "headless_screws", "names": ["Headless Progressive Thread Screws", "Headless progressive thread screws"], "product_id": 31, "category_id": 11, "partner_id": 20},
    {"key": "arthrodesis_plates", "names": ["Arthrodesis Plates"], "product_id": 25, "category_id": 11, "partner_id": 20},
    {"key": "calcaneal_displacement", "names": ["Calcaneal displacement plates", "Calcaneal displacement Plates"], "product_id": 26, "category_id": 11, "partner_id": 20},
    {"key": "evans_osteotomy", "names": ["Evans Osteotomy Plates and Wedges", "Evans osteotomy plates and wadges"], "product_id": 30, "category_id": 11, "partner_id": 20},
    {"key": "calcaneal_fracture_plate", "names": ["Calcaneal facture plate", "Calcaneal fracture plate"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "multihole_plate", "names": ["multihole plate"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "interposition_plates", "names": ["Interposition Plates", "Interposition plates"], "product_id": 32, "category_id": 11, "partner_id": 20},
    {"key": "malleolar_t_plate", "names": ["Malleolar T plate"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "diabetic_foot", "names": ["Diabetic Foot", "Diabetic foot"], "product_id": 29, "category_id": 11, "partner_id": 20},
    {"key": "cannulated_cortical", "names": ["Cannulated Cortical Screws", "Cannulated Cortical screws", "Double threaded screws", "Double threaded canulate screws"], "product_id": 27, "category_id": 11, "partner_id": 20},
    {"key": "vcp_blade_plate", "names": ["VCP blade plate"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "talar_screw", "names": ["Talar screw"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "xcalc_calcaneal", "names": ["Xcalc calcaneal screws"], "product_id": None, "category_id": 11, "partner_id": 20},
    {"key": "subtalar_arthroereisis", "names": ["Subtalar arthroersis", "Subtalar arthroereisis"], "product_id": None, "category_id": 11, "partner_id": 20},
]

def normalize_name(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower().rstrip(":"))


NAME_LOOKUP = {}
for d in PRODUCT_DEFS:
    for n in d["names"]:
        NAME_LOOKUP[normalize_name(n)] = d["key"]


def is_product_header(text: str) -> bool:
    t = text.strip()
    if not t.endswith(":"):
        return False
    name = t[:-1].strip()
    if len(name) > 80:
        return False
    if " is indicated" in name.lower() or "requiring compression" in name.lower():
        return False
    if normalize_name(name) in NAME_LOOKUP:
        return True
    return len(name.split()) <= 6


def is_subproduct_header(text: str) -> bool:
    t = text.strip()
    if not t or t.endswith(":") or t.endswith(";"):
        return False
    if len(t) > 70 or len(t.split()) > 10:
        return False
    if t[0].islower():
        return False
    return normalize_name(t) in NAME_LOOKUP


def natural_media_sort(paths):
    def key(p):
        m = re.search(r"image(\d+)", Path(p).name, re.I)
        return int(m.group(1)) if m else 0
    return sorted(paths, key=key)


def extract_images_from_docx(doc_path: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    mapping = {}
    with zipfile.ZipFile(doc_path) as z:
        media_paths = natural_media_sort(n for n in z.namelist() if n.startswith("word/media/"))
        for i, media_path in enumerate(media_paths):
            ext = Path(media_path).suffix or ".png"
            filename = f"image_{i+1:03d}{ext}"
            (out_dir / filename).write_bytes(z.read(media_path))
            mapping[media_path] = filename
    return mapping


def build_rid_map(doc: Document) -> dict:
    rid_map = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            target = rel.target_ref
            if not target.startswith("word/"):
                target = "word/" + target.lstrip("/")
            rid_map[rel.rId] = target
    return rid_map


def get_para_images(para, rid_map, media_map):
    files = []
    for run in para.runs:
        for blip in run._element.findall(".//" + qn("a:blip")):
            rid = blip.get(qn("r:embed"))
            media = rid_map.get(rid)
            if media and media in media_map:
                files.append(media_map[media])
    return files


def find_product_key(text: str):
    n = normalize_name(text.rstrip(":"))
    if n in NAME_LOOKUP:
        return NAME_LOOKUP[n]
    for alias, key in NAME_LOOKUP.items():
        if alias in n or n in alias:
            return key
    return None


def parse_document():
    doc = Document(DOC_PATH)
    media_map = extract_images_from_docx(DOC_PATH, IMG_DIR)
    rid_map = build_rid_map(doc)

    products = {d["key"]: {
        "key": d["key"],
        "product_id": d["product_id"],
        "category_id": d["category_id"],
        "partner_id": d["partner_id"],
        "name": d["names"][0],
        "description_lines": [],
        "specifications": [],
        "images": [],
    } for d in PRODUCT_DEFS}

    current_key = None
    current_partner = 20
    section_stack = []

    for para in doc.paragraphs:
        text = para.text.strip()
        imgs = get_para_images(para, rid_map, media_map)

        if text in ("Astrolabe",):
            current_partner = 20
            continue
        if text in ("PerMedica", "Permedica"):
            current_partner = 10
            continue

        if text.endswith(":") and is_product_header(text):
            key = find_product_key(text)
            if key:
                current_key = key
                products[key]["name"] = text[:-1].strip()
                products[key]["partner_id"] = current_partner
                section_stack = [key]
                if imgs:
                    products[key]["images"].extend(imgs)
                continue

        if text and is_subproduct_header(text):
            key = find_product_key(text)
            if key:
                current_key = key
                products[key]["name"] = text.strip()
                products[key]["partner_id"] = current_partner
                if imgs:
                    products[key]["images"].extend(imgs)
                continue

        if imgs and current_key:
            products[current_key]["images"].extend(imgs)

        if not text or not current_key:
            continue

        if text.endswith(";") or (text.startswith("•") and ";" in text):
            products[current_key]["specifications"].append(text.rstrip(";").lstrip("•\t"))
        elif text.endswith(".") and len(text) < 120 and not text.endswith(".."):
            if any(kw in text.lower() for kw in ["titanium", "screw", "plate", "locking", "design", "material"]):
                products[current_key]["specifications"].append(text.rstrip("."))
            else:
                products[current_key]["description_lines"].append(text)
        else:
            products[current_key]["description_lines"].append(text)

    result = []
    for d in PRODUCT_DEFS:
        p = products[d["key"]]
        p["images"] = list(dict.fromkeys(p["images"]))
        p["description"] = " ".join(p["description_lines"]).strip()
        p["specifications_text"] = "\n".join(dict.fromkeys(p["specifications"])).strip()
        p["product_code"] = re.sub(r"[^A-Za-z0-9&]+", " ", p["name"]).strip()[:80]
        if p["description"] or p["specifications_text"] or p["images"]:
            result.append(p)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Parsed {len(result)} products with content")
    with_images = sum(1 for p in result if p["images"])
    total_imgs = sum(len(p["images"]) for p in result)
    print(f"Products with images: {with_images}, total image refs: {total_imgs}")
    return result


def sb_headers():
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def sb_rest(method, path, **kwargs):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    r = requests.request(method, url, headers=sb_headers(), timeout=60, **kwargs)
    if r.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:500]}")
    return r.json() if r.text else None


def upload_image(local_path: Path, storage_path: str) -> str:
    content_type = "image/png"
    if local_path.suffix.lower() in (".jpg", ".jpeg"):
        content_type = "image/jpeg"
    elif local_path.suffix.lower() == ".webp":
        content_type = "image/webp"

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


def import_products(products, dry_run=False):
    if not SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY env var required")

    stats = {"created": 0, "updated": 0, "images_uploaded": 0, "image_records": 0, "errors": []}

    for p in products:
        try:
            product_id = p.get("product_id")
            name = p["name"]
            code = p["product_code"] or name

            payload = {
                "product_name": name,
                "product_code": code,
                "category_id": p["category_id"],
                "partner_id": p["partner_id"],
                "description": p["description"] or None,
                "specifications": p["specifications_text"] or None,
                "is_active": True,
            }

            if product_id:
                if not dry_run:
                    sb_rest("PATCH", f"products?product_id=eq.{product_id}", json=payload)
                stats["updated"] += 1
            else:
                if not dry_run:
                    rows = sb_rest("POST", "products", json=payload)
                    product_id = rows[0]["product_id"]
                    p["product_id"] = product_id
                stats["created"] += 1

            if not product_id and dry_run:
                continue

            # Ensure branch_products link
            if not dry_run:
                existing = sb_rest(
                    "GET",
                    f"branch_products?product_id=eq.{product_id}&branch_id=eq.{UK_BRANCH_ID}&select=branch_product_id",
                )
                if not existing:
                    sb_rest("POST", "branch_products", json={
                        "product_id": product_id,
                        "branch_id": UK_BRANCH_ID,
                        "is_available": True,
                        "is_public": True,
                        "local_description": p["description"] or None,
                    })

            # Replace images for this product+branch
            if p["images"] and not dry_run:
                sb_rest("DELETE", f"product_images?product_id=eq.{product_id}&branch_id=eq.{UK_BRANCH_ID}")

            for idx, img_file in enumerate(p["images"]):
                local = IMG_DIR / img_file
                if not local.exists():
                    stats["errors"].append(f"Missing image {img_file} for {name}")
                    continue

                ext = local.suffix
                storage_name = f"{int(time.time() * 1000)}_{p['key']}_{idx+1}{ext}"
                storage_path = f"{UK_BRANCH_CODE}/{storage_name}"

                if not dry_run:
                    upload_image(local, storage_path)
                    stats["images_uploaded"] += 1
                    sb_rest("POST", "product_images", json={
                        "product_id": product_id,
                        "branch_id": UK_BRANCH_ID,
                        "image_url": storage_path,
                        "image_alt_text": name,
                        "image_type": "gallery",
                        "image_order": idx + 1,
                        "is_primary": idx == 0,
                    })
                    stats["image_records"] += 1
                else:
                    stats["images_uploaded"] += 1

        except Exception as e:
            stats["errors"].append(f"{p.get('name')}: {e}")

    return stats


def main():
    dry_run = "--dry-run" in sys.argv
    products = parse_document()
    if "--parse-only" in sys.argv:
        return
    stats = import_products(products, dry_run=dry_run)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
