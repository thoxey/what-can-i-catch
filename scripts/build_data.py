#!/usr/bin/env python3
"""
Parses Critters.xlsx and acnh-images/ into:
  - web/public/critters.json
  - web/public/icons/{fish,bugs,sea}/<slug>.png

Run from repo root: python3 scripts/build_data.py
"""
import json
import re
import shutil
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "Critters.xlsx"
IMAGES_ROOT = ROOT / "acnh-images" / "images"
OUT_DIR = ROOT / "web" / "public"
ICONS_DIR = OUT_DIR / "icons"

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Per-sheet column layout (1-indexed). "n_start" = first Jan column for Northern hemisphere.
SHEETS = {
    "fish": {
        "sheet": "Fish",
        "image_dir": "Fish",
        "name": 2, "price": 3, "time": 4, "location": 5, "shadow": 6,
        "n_start": 7, "s_start": 20,
    },
    "bugs": {
        "sheet": "Bugs",
        "image_dir": "Insects",
        "name": 2, "price": 3, "time": 4, "location": 5, "shadow": None,
        "n_start": 8, "s_start": 21,
    },
    "sea": {
        "sheet": "Sea Creatures",
        "image_dir": "Sea Creatures",
        "name": 2, "price": 3, "time": 4, "location": None, "shadow": None,
        "n_start": 5, "s_start": 18,
    },
}


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def build_folder_index(image_dir: Path) -> dict[str, Path]:
    """Map slugified folder name -> folder path."""
    if not image_dir.is_dir():
        print(f"WARN: missing image dir {image_dir}", file=sys.stderr)
        return {}
    return {slugify(p.name): p for p in image_dir.iterdir() if p.is_dir()}


def find_icon(folder_index: dict[str, Path], name: str) -> Path | None:
    slug = slugify(name)
    folder = folder_index.get(slug)
    if not folder:
        # Try a couple of fuzzy fallbacks
        for variant in [slug.replace("-", ""), slug.replace("fish", "")]:
            for k, v in folder_index.items():
                if k.replace("-", "") == variant:
                    folder = v
                    break
            if folder:
                break
    if not folder:
        return None
    icon = folder / "Icon Image.png"
    if icon.exists():
        return icon
    # Fallback to critterpedia image if icon missing
    cp = folder / "Critterpedia Image.png"
    return cp if cp.exists() else None


def parse_sheet(wb, cat: str, cfg: dict) -> list[dict]:
    ws = wb[cfg["sheet"]]
    rows = []
    for row in ws.iter_rows(min_row=3, values_only=True):
        name = row[cfg["name"] - 1]
        if not name or not isinstance(name, str):
            continue
        price = row[cfg["price"] - 1]
        time_str = row[cfg["time"] - 1]
        location = row[cfg["location"] - 1] if cfg["location"] else None
        shadow = row[cfg["shadow"] - 1] if cfg["shadow"] else None
        n_months = [bool(row[cfg["n_start"] - 1 + i]) for i in range(12)]
        s_months = [bool(row[cfg["s_start"] - 1 + i]) for i in range(12)]
        rows.append({
            "name": name,
            "slug": slugify(name),
            "category": cat,
            "price": price,
            "time": time_str,
            "location": location,
            "shadow": shadow,
            "months": {"north": n_months, "south": s_months},
        })
    return rows


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_critters = {}
    missing = []

    for cat, cfg in SHEETS.items():
        critters = parse_sheet(wb, cat, cfg)
        folder_index = build_folder_index(IMAGES_ROOT / cfg["image_dir"])

        cat_icons = ICONS_DIR / cat
        cat_icons.mkdir(parents=True, exist_ok=True)

        for c in critters:
            icon_src = find_icon(folder_index, c["name"])
            if icon_src:
                dst = cat_icons / f"{c['slug']}.png"
                shutil.copyfile(icon_src, dst)
                c["icon"] = f"/icons/{cat}/{c['slug']}.png"
            else:
                c["icon"] = None
                missing.append(f"{cat}: {c['name']}")

        all_critters[cat] = critters
        print(f"{cat}: {len(critters)} critters, {sum(1 for c in critters if c['icon'])} with icons")

    out_file = OUT_DIR / "critters.json"
    out_file.write_text(json.dumps(all_critters, indent=2))
    print(f"\nWrote {out_file}")
    if missing:
        print(f"\n{len(missing)} missing icons:")
        for m in missing:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
