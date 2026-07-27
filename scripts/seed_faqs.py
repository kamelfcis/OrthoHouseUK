#!/usr/bin/env python3
"""
Seed / replace FAQs for UK branch (branch_id=2).

Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.
Prefer running the SQL migration (includes DDL + seed) in the Supabase SQL Editor.

Usage:
  python scripts/seed_faqs.py
  python scripts/seed_faqs.py --dry-run
  python scripts/seed_faqs.py --replace
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
SUPABASE_URL = os.environ.get(
    "VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co"
).rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2

# (category, question, answer, display_order, answer_image_url|None)
SEED = [
    (
        'mirai_shoulder',
        'What is the MIRAI® Shoulder System provided by OrthoHouse? What clinical indications does it cover, and what configurations are available?',
        'Distributed by OrthoHouse, the MIRAI® Shoulder System is a comprehensive, modular shoulder arthroplasty platform designed for both Anatomical and Reverse Shoulder Arthroplasty (RSA). It offers UK orthopedic consultants maximum intraoperative flexibility, joint stability, and optimal biomechanical restoration across primary, trauma, and revision cases.\n\nThe MIRAI® system is a fully convertible platform supporting seamless intraoperative transitions through three versatile stem configurations:\nStemless Version (utilizing the high-fixation Humeral Core Cage)\nStemmed Version\nTrauma Version (utilizing the dedicated Trauma Core)\n\nSources:\nPermedica Orthopaedics – MIRAI® System Overview & Product Catalog\nPermedica Orthopaedics – MIRAI® Modular Shoulder System Brochure',
        1,
        None,
    ),
    (
        'mirai_shoulder',
        'What proprietary technologies are integrated into the MIRAI® Shoulder System?',
        'The MIRAI® System incorporates three flagship biomaterial innovations:\nTRASER® (Trabecular Laser Melted Titanium): A 3D-printed porous titanium structure mimicking natural trabecular bone to accelerate biological ingrowth and primary/secondary fixation.\nVITAL-B® (TiNbN Coating): A ceramic-like Titanium Niobium Nitride protective layer offering superior surface hardness, reduced friction coefficients, and hypoallergenic protection.\nVITAL-E® (+0.1% Vitamin E Polyethylene): Highly cross-linked polyethylene infused with Vitamin E to provide maximum oxidative stability, mechanical strength, and ultra-low wear rates over time.\n\nSource: Permedica Orthopaedics – Advanced Biomaterials & Surface Technology Technical Dossier',
        2,
        None,
    ),
    (
        'mirai_shoulder',
        'How does TRASER® technology improve fixation in stemless cases?',
        "TRASER®'s open-pore 3D printing trabecular matrix provides an ideal scaffold for osteoblast migration and vascularization. In stemless configurations, the Humeral Core Cage with TRASER® delivers immediate mechanical stability and long-term bone preservation without invading the humeral canal.\n\nSource: Permedica Orthopaedics – TRASER® Technology White Paper & Surgical Technique",
        3,
        None,
    ),
    (
        'mirai_shoulder',
        'Is the MIRAI® System suitable for patients with metal hypersensitivity, and how durable is the VITAL-B® coating against peeling?',
        'Yes. The MIRAI® System is fully engineered for patients with documented hypersensitivity to nickel, cobalt, chromium, or heavy metals:\nMetal Ion Barrier: VITAL-B® (TiNbN) forms a dense, biologically inert barrier that eliminates heavy metal ion migration into surrounding tissue.\nAtomic-Level Bond & Anti-Delamination: Applied via advanced Physical Vapor Deposition (PVD), VITAL-B® forms an atomic-level metallurgical bond with the substrate rather than a conventional sprayed layer, guaranteeing the coating will not peel, flake, or delaminate under cyclic loading.\nCeramic-Like Hardness: Delivers extreme surface hardness (~2,000–2,500 Vickers Hardness) with ultra-low friction, dramatically reducing abrasive wear and debris.\n\nSources:\nPermedica Orthopaedics – BIOLOY® Hypoallergenic Surface Modification Dossier\nISO 20502: Determination of Adhesion & Anti-Delamination of Ceramic Coatings\nISO 10993-18: Biological Evaluation of Medical Devices – Chemical Characterization & Ion Release Barriers',
        4,
        None,
    ),
    (
        'mirai_shoulder',
        'What simulator wear testing supports the long-term durability of OrthoHouse’s MIRAI® System?',
        'The MIRAI® System features an innovative Material-Inversion Design where the articulating glenoid insert is a Ti6Al4V alloy PVD-coated with hard, scratch-resistant TiNbN (VITAL-B®), while the humeral head is made of highly cross-linked, vitamin E-infused UHMWPE (VITAL-E®). Under multi-million cycle simulator testing:\nTest Parameters: In tests with a constant axial load of 756 N combined with angular motions, the system was run for up to 2.5 million cycles.\nProven Results: After 2.5 million cycles, the mean mass loss of the humeral head was recorded at just 0.68 mg.\nClinical Significance: The extremely low wear rate confirms that non-spherical, low-conforming designs reduce stress, translational forces, and frictional torque typically responsible for bearing degradation and aseptic loosening.\n\nSources:\nPermedica S.p.A. – In-Vitro Biomechanical Wear Simulator Performance Report\nThe Bone & Joint Journal – Biomechanical & Tribological Evaluation Studies\nNational Center for Biotechnology Information (NCBI / PubMed) – Polyethylene Wear Dynamics in Shoulder Arthroplasty',
        5,
        None,
    ),
    (
        'mirai_shoulder',
        'How does 3D MIRAI® Planning assist surgeons before surgery?',
        'OrthoHouse provides integrated 3D MIRAI® Planning software, allowing consultants to perform precise preoperative CT-based anatomical evaluation, optimal implant sizing, glenoid positioning, and offset restoration tailored to each patient’s unique anatomy.\n\nSource: Permedica Orthopaedics – 3D MIRAI® Digital Preoperative Planning Suite',
        6,
        None,
    ),
    (
        'mirai_shoulder',
        'Can UK consultants visit a reference center, attend workshops, or discuss clinical outcomes with peer surgeons?',
        'Yes. OrthoHouse maintains active clinical reference networks across Europe and the Middle East. We facilitate peer-to-peer discussions, Cadaver workshops, clinical observation sessions, and academic data sharing with leading consultants using the system.\n\nSource: OrthoHouse Medical Education & Clinical Events Portal',
        7,
        None,
    ),
    (
        'osteosynt',
        'What is OSTEOSYNT®?',
        "OSTEOSYNT® is a family of synthetic bone substitute products, utilising the ultimate generation of biphasic bioceramics, containing Hydroxyapatite and β-Tricalcium Phosphate. It is highly biocompatible due to its unique nanostructure, which features micro, meso, and macro intercommunicating pores, as well as its unmatched surface topography that enhances cell adhesion, proliferation, and differentiation. Both osteoconductive and osteoinductive, OSTEOSYNT® allows for controlled bone remodelling and resorption. OSTEOSYNT®'s unique chemical composition is both biomimetic and bioactive, allowing continuity between the existing bone and the new bone.\n\nOSTEOSYNT® is widely used across orthopaedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss.\n\nThe Brazilian nanotechnology company, Eincobio, manufactures OSTEOSYNT®.",
        1,
        None,
    ),
    (
        'osteosynt',
        'What makes OSTEOSYNT® different?',
        'As the composition is very similar to human bone matrix, OSTEOSYNT® acts as a scaffold for the formation of new bone tissue and is gradually replaced according to the metabolic activity of each patient. OSTEOSYNT® provides greater efficiency due to its chemical and unique physical characteristics.',
        2,
        '/assets/faqs/osteosynt-characteristics.png',
    ),
    (
        'osteosynt',
        'What forms does it come in?',
        'Injectable (pre-hydrated)\nGranules\nSpheres\nBlocks and wedges\nCervical blocks and craniotomy buttons\n\nPlease note: Blocks and wedges can be cut to size, and custom shapes are available upon request (with a lead time of approximately 4 weeks).',
        3,
        None,
    ),
    (
        'osteosynt',
        'What indications is OSTEOSYNT® approved for?',
        'OSTEOSYNT® is used across orthopedics, dentistry, plastic, and maxillofacial surgery to repair, reconstruct, or recover bone loss. OSTEOSYNT® has been used for over 40 years in infections, revision surgery, spine deformities, fractures, fusions, revision prosthesis, pseudo arthritis, and more.',
        4,
        None,
    ),
    (
        'osteosynt',
        'Does OSTEOSYNT® contain antibiotics?',
        'OSTEOSYNT® does not contain antibiotics. Our products can be hydrated with saline, blood, or any liquid antibiotics, allowing surgeons complete control in the customised management of any infection(s) and to provide an option for patients with specific allergies, intolerances, or in cases of specific antibiotic resistance.',
        5,
        None,
    ),
    (
        'osteosynt',
        'What are the biological contamination risks?',
        'OSTEOSYNT® is 100% synthetic, giving you peace of mind by eliminating any of the risks associated with animal-derived (xenografts) or human donor materials (allografts).',
        6,
        None,
    ),
    (
        'osteosynt',
        'Does OSTEOSYNT® provide immediate stability?',
        'OSTEOSYNT® is a bioactive ceramic that works differently from traditional bone cement. Our range of blocks and wedges has been manufactured to withstand high mechanical loads. OSTEOSYNT® blocks and wedges can stand up to 90 MPa of load, compared to cortical bone of approximately 100 MPa.',
        7,
        None,
    ),
    (
        'osteosynt',
        'Can OSTEOSYNT® be seen on X-ray?',
        'OSTEOSYNT® is radio-opaque, so it can be clearly seen on X-ray.',
        8,
        None,
    ),
    (
        'osteosynt',
        'How do I order?',
        'Please visit our Meet the Team page to speak with your local OrthoHouse representative.',
        9,
        None,
    ),
    (
        'orthosintex',
        'What screw sizes are the foot and ankle systems?',
        'The Orthosintex Episcan portfolio offers screw systems in 2.7 mm, 3.5 mm, and 4.0 mm diameters, depending on the implant and procedure.',
        1,
        None,
    ),
    (
        'orthosintex',
        'What is the main focus of the Orthosintex Episcan portfolio?',
        'The Orthosintex Episcan portfolio provides comprehensive fixation solutions for foot and ankle surgery. The range includes implants designed for forefoot, midfoot, and hindfoot procedures, as well as flatfoot correction, trauma, arthrodesis, osteotomies, and minimally invasive surgery (MIS).',
        2,
        None,
    ),
    (
        'orthosintex',
        'Where are the products manufactured?',
        "All Orthosintex products are designed, researched, and manufactured in Italy. 100% of the research, development, and manufacturing takes place within Orthosintex's dedicated manufacturing facilities, ensuring high-quality standards and full control of the production process.",
        3,
        None,
    ),
    (
        'orthosintex',
        'What foot and ankle procedures can the Orthosintex portfolio support?',
        'The portfolio supports a wide range of foot and ankle procedures, including:\nHallux valgus correction\nArthrodesis\nOsteotomies\nFracture fixation\nFlatfoot reconstruction\nCalcaneal osteotomies\nMinimally invasive foot surgery (MIS)',
        4,
        None,
    ),
    (
        'orthosintex',
        'Are our products MHRA registered?',
        "Yes. Orthosintex Episcan products are registered with the UK's Medicines and Healthcare products Regulatory Agency (MHRA) for use within the UK.",
        5,
        None,
    ),
    (
        'orthosintex',
        'Are the products sterile?',
        'Yes. All Orthosintex Episcan implants are supplied sterile and ready for use, helping to support efficient theatre workflow and minimise preparation time.',
        6,
        None,
    ),
    (
        'orthosintex',
        'What material are Orthosintex implants made from?',
        'Most Orthosintex implants are manufactured from Titanium Grade 5 (Ti-6Al-4V) or Titanium Grade 2, depending on the implant. Titanium is selected for its excellent strength, corrosion resistance, biocompatibility, and compatibility with orthopaedic applications.',
        7,
        None,
    ),
    (
        'orthosintex',
        'Are the screws locking, non-locking, or both?',
        'We provide cortical non-locking and locking screws for 2.7mm, 3.5mm, and 4.0mm locking screw for the VCP plate.',
        8,
        None,
    ),
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
        "Prefer": "return=representation",
    }


def existing_count() -> int:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/faqs?branch_id=eq.{UK_BRANCH_ID}&select=faq_id",
        headers=headers(),
        timeout=30,
    )
    if resp.status_code == 404 or "PGRST205" in resp.text:
        raise SystemExit(
            "faqs table not found. Run supabase/migrations/20260727_create_faqs.sql "
            "then 20260727_replace_faqs_mirai_content.sql in the SQL Editor first."
        )
    resp.raise_for_status()
    return len(resp.json())


def delete_uk_faqs() -> None:
    resp = requests.delete(
        f"{SUPABASE_URL}/rest/v1/faqs?branch_id=eq.{UK_BRANCH_ID}",
        headers=headers(),
        timeout=60,
    )
    if resp.status_code not in (200, 204):
        raise SystemExit(f"Delete failed ({resp.status_code}): {resp.text[:500]}")


def seed(dry_run: bool = False, replace: bool = False) -> None:
    count = existing_count()
    if count > 0 and not replace:
        print(f"UK branch already has {count} FAQ(s); skipping seed. Use --replace to overwrite.")
        return

    rows = [
        {
            "branch_id": UK_BRANCH_ID,
            "category": category,
            "question": question,
            "answer": answer,
            "display_order": order,
            "is_published": True,
            "answer_image_url": image_url,
        }
        for category, question, answer, order, image_url in SEED
    ]

    if dry_run:
        action = "replace" if (count > 0 and replace) else "insert"
        print(f"Would {action} {len(rows)} FAQ rows for branch_id={UK_BRANCH_ID}")
        for row in rows:
            img = f" [img={row['answer_image_url']}]" if row["answer_image_url"] else ""
            print(f"  [{row['category']}] {row['question']}{img}")
        return

    if count > 0 and replace:
        delete_uk_faqs()
        print(f"Deleted {count} existing UK FAQ(s).")

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/faqs",
        headers=headers(),
        json=rows,
        timeout=60,
    )
    if resp.status_code not in (200, 201):
        raise SystemExit(f"Seed failed ({resp.status_code}): {resp.text[:500]}")
    print(f"Seeded {len(rows)} FAQs for UK branch_id={UK_BRANCH_ID}.")


def main() -> None:
    load_env()
    global SERVICE_KEY, SUPABASE_URL
    SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_URL = os.environ.get(
        "VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co"
    ).rstrip("/")

    parser = argparse.ArgumentParser(description="Seed UK FAQs")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing UK FAQs before inserting",
    )
    args = parser.parse_args()
    seed(dry_run=args.dry_run, replace=args.replace)


if __name__ == "__main__":
    main()
