#!/usr/bin/env python3
"""
Seed market-engagement blog posts (slide 19) into Supabase.

Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.
Uploads optimised local images to the blog-images bucket, then inserts rows.

Usage:
  python scripts/seed_market_engagement_blogs.py
  python scripts/seed_market_engagement_blogs.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "scripts" / "tmp" / "market_engagement_seed.json"

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ljfkmtuxqaznnmmxeydf.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
UK_BRANCH_ID = 2


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
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required to seed blogs.")
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def upload_image(local_rel: str, storage_name: str) -> str:
    """Upload a public asset to blog-images bucket; return storage path."""
    local_path = ROOT / "public" / local_rel.lstrip("/")
    if not local_path.exists():
        raise FileNotFoundError(local_path)

    storage_path = f"market-engagement/{storage_name}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/blog-images/{storage_path}"

    content_type = "image/webp" if local_path.suffix == ".webp" else "image/jpeg"
    with local_path.open("rb") as fh:
        resp = requests.post(
            upload_url,
            headers={**headers(), "Content-Type": content_type, "x-upsert": "true"},
            data=fh.read(),
            timeout=120,
        )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed ({resp.status_code}): {resp.text[:300]}")
    return storage_path


def get_author_id() -> int | None:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/app_users?select=user_id&limit=1",
        headers=headers(),
        timeout=30,
    )
    if resp.status_code == 200 and resp.json():
        return resp.json()[0]["user_id"]
    return None


def existing_titles() -> set[str]:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/blogs?branch_id=eq.{UK_BRANCH_ID}&select=title",
        headers=headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return {row["title"].lower() for row in resp.json()}


def insert_blog(row: dict, author_id: int | None) -> dict:
    payload = {
        "title": row["title"],
        "excerpt": row["excerpt"],
        "content": row["content"],
        "featured_image": row["featured_image"],
        "branch_id": UK_BRANCH_ID,
        "status": "published",
        "is_public": True,
        "published_at": row["published_at"],
    }
    if author_id:
        payload["author_id"] = author_id

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/blogs",
        headers=headers(),
        json=payload,
        timeout=30,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Insert failed ({resp.status_code}): {resp.text[:400]}")
    return resp.json()[0]


# Inline seed data (content synced with marketEngagementBlogs.js)
SEED_POSTS = [
    {
        "slug": "bess-conference-2025",
        "title": "BESS Conference 2025 — Showcasing Our Shoulder & Upper Limb Portfolio",
        "excerpt": "OrthoHouse UK joined the British Elbow & Shoulder Society (BESS) annual conference to present our shoulder and upper-extremity implant portfolio to leading UK surgeons.",
        "content": """OrthoHouse UK was proud to participate in the BESS Conference 2025, the flagship gathering of the British Elbow & Shoulder Society. The event brought together consultant surgeons, trainees, and allied health professionals with a shared focus on shoulder and upper-limb orthopaedics.

Our team showcased a curated portfolio of shoulder and upper-extremity solutions — from trauma fixation to arthroplasty systems — highlighting how OrthoHouse UK supports evidence-based surgical practice across the NHS and independent sector.

Throughout the congress we welcomed surgeons to our exhibition space for product demonstrations, clinical pathway discussions, and introductions to our manufacturing partners. BESS remains a cornerstone of our UK market engagement calendar, reflecting our long-term commitment to the upper-extremity orthopaedic community.

Keywords: BESS, British Elbow and Shoulder Society, shoulder surgery, upper limb, conference 2025, orthopaedic exhibition, OrthoHouse UK.""",
        "published_at": "2025-03-15T09:00:00.000Z",
        "image_local": "assets/optimized/events/blogs-1200.webp",
    },
    {
        "slug": "boa-conference-2025",
        "title": "BOA Annual Congress 2025 — Engaging UK Orthopaedic Stakeholders",
        "excerpt": "At the British Orthopaedic Association (BOA) Annual Congress, OrthoHouse UK connected with key orthopaedic stakeholders across hospitals, procurement, and clinical leadership.",
        "content": """The BOA Annual Congress 2025 provided OrthoHouse UK with a national platform to engage directly with the UK's orthopaedic community. As the profession's leading professional body, the British Orthopaedic Association convenes surgeons, trainees, and healthcare leaders to share research, innovation, and best practice.

Our presence at BOA focused on building relationships with key stakeholders — from consultant surgeons and theatre teams to procurement specialists and hospital management. We discussed how OrthoHouse UK delivers reliable implant supply, regulatory compliance, and responsive clinical support across trauma, arthroplasty, and foot & ankle specialities.

BOA remains central to our active market engagement strategy. By participating at this scale, we reinforce OrthoHouse UK's role as a trusted distribution partner for world-class orthopaedic manufacturers serving the United Kingdom.

Keywords: BOA, British Orthopaedic Association, annual congress, orthopaedic stakeholders, UK market, NHS, conference 2025, OrthoHouse UK.""",
        "published_at": "2025-04-22T09:00:00.000Z",
        "image_local": "assets/optimized/events/gallery-1200.webp",
    },
    {
        "slug": "kbp-uk-embassy-egypt-2025",
        "title": "KBP at the UK Embassy in Egypt — Strengthening International Partnerships",
        "excerpt": "OrthoHouse UK participated in the KBP programme at the British Embassy in Egypt, advancing international partnerships and clinical collaboration between the UK and the Middle East.",
        "content": """OrthoHouse UK was honoured to take part in the KBP (Knowledge Transfer & Business Partnership) initiative hosted at the UK Embassy in Egypt. This engagement reflects our commitment to strengthening international partnerships and fostering clinical collaboration across borders.

The programme brought together healthcare leaders, industry partners, and diplomatic stakeholders to explore opportunities for knowledge exchange, surgical education, and responsible distribution of orthopaedic technologies. Our team shared insights from the UK market — including regulatory pathways, surgeon education models, and partnership structures that support safe, effective patient care.

International collaboration is a strategic pillar for OrthoHouse. By participating in embassy-led initiatives, we build bridges between UK manufacturing excellence and growing clinical communities in the Middle East and North Africa region.

Keywords: KBP, UK Embassy Egypt, international partnerships, clinical collaboration, Middle East, orthopaedic distribution, OrthoHouse UK, 2025.""",
        "published_at": "2025-05-08T09:00:00.000Z",
        "image_local": "assets/optimized/presentation/life-at-orthohouse-03-838x885-1200.webp",
    },
    {
        "slug": "bofas-conference-2025-platinum-sponsor",
        "title": "BOFAS Annual Conference 2025 — Platinum Sponsor for Foot & Ankle",
        "excerpt": "As a Platinum Sponsor of the British Orthopaedic Foot & Ankle Society (BOFAS) Annual Conference, OrthoHouse UK led a prominent presence in foot and ankle surgery.",
        "content": """OrthoHouse UK was delighted to serve as a Platinum Sponsor at the BOFAS Annual Conference 2025. The British Orthopaedic Foot & Ankle Society is the UK's authoritative voice for foot and ankle surgery, and our sponsorship underscored our strategic commitment to this speciality.

Throughout the conference, our team engaged with foot and ankle consultants, fellows, and allied professionals — presenting advanced fixation systems, osteotomy solutions, and arthrodesis platforms from our partner manufacturers. Platinum sponsorship enabled a high-visibility presence, supporting educational sessions and facilitating meaningful dialogue with the surgical community.

Foot & ankle remains one of the fastest-evolving areas of orthopaedic practice. By investing in BOFAS at the highest sponsorship tier, OrthoHouse UK demonstrates leadership in bringing innovative, evidence-based technologies to UK surgeons.

Keywords: BOFAS, British Orthopaedic Foot and Ankle Society, platinum sponsor, foot and ankle, conference 2025, orthopaedic sponsorship, OrthoHouse UK.""",
        "published_at": "2025-06-12T09:00:00.000Z",
        "image_local": "assets/optimized/presentation/1st-cadaver-courses-in-middle-east-05-895x610-1200.webp",
    },
]


def main() -> int:
    load_env()
    global SERVICE_KEY
    SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)

    parser = argparse.ArgumentParser(description="Seed market engagement blogs to Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without writing")
    args = parser.parse_args()

    if args.dry_run:
        print(json.dumps(SEED_POSTS, indent=2))
        print(f"\n{len(SEED_POSTS)} posts ready to seed (dry run).")
        return 0

    titles = existing_titles()
    author_id = get_author_id()
    created = 0

    for post in SEED_POSTS:
        if post["title"].lower() in titles:
            print(f"  skip (exists): {post['title']}")
            continue

        storage_path = upload_image(post["image_local"], f"{post['slug']}.webp")
        post_row = {**post, "featured_image": storage_path}
        result = insert_blog(post_row, author_id)
        print(f"  created blog_id={result.get('blog_id')}: {post['title']}")
        created += 1

    print(f"\nDone: {created} blog post(s) created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
