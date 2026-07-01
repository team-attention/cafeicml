#!/usr/bin/env python3
"""Build and verify a single sponsor-logo strip for the Luma page.

The layout algorithm keeps at most three logos per row, trims transparent
padding from each source logo, scales logos to a shared visual height with a
width cap, and centers each row inside a rounded white card.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SPONSORS = ROOT / "data/sponsors.json"
DEFAULT_OUTPUT = ROOT / "assets/logos/sponsors-strip.png"
DEFAULT_REPORT = ROOT / "generated/sponsors-strip-report.json"


@dataclass(frozen=True)
class Sponsor:
    name: str
    logo: Path
    url: str


def load_sponsors(path: Path) -> list[Sponsor]:
    data = json.loads(path.read_text(encoding="utf-8"))
    sponsors: list[Sponsor] = []
    for item in data:
        logo = Path(item["logo"])
        if not logo.is_absolute():
            logo = ROOT / logo
        sponsors.append(Sponsor(name=item["name"], logo=logo, url=item["url"]))
    return sponsors


def content_bbox(image: Image.Image, alpha_threshold: int = 8) -> tuple[int, int, int, int]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(lambda value: 255 if value > alpha_threshold else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("logo has no visible pixels")
    return bbox


def chunks(items: list[Sponsor], size: int) -> list[list[Sponsor]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def intersects(a: dict[str, int], b: dict[str, int]) -> bool:
    return not (a["right"] <= b["left"] or b["right"] <= a["left"] or a["bottom"] <= b["top"] or b["bottom"] <= a["top"])


def build_strip(
    *,
    sponsors: list[Sponsor],
    output: Path,
    report: Path,
    max_per_row: int = 3,
    canvas_width: int = 1600,
    card_padding_x: int = 120,
    card_padding_y: int = 88,
    cell_width: int = 500,
    cell_height: int = 184,
    gap_x: int = 100,
    gap_y: int = 54,
    target_logo_height: int = 118,
    max_logo_width: int = 470,
) -> dict[str, Any]:
    if not sponsors:
        raise ValueError("at least one sponsor is required")
    if max_per_row < 1:
        raise ValueError("max_per_row must be at least 1")
    if max_per_row > 3:
        raise ValueError("Luma sponsor strip policy allows at most 3 logos per row")

    rows = chunks(sponsors, max_per_row)
    canvas_height = card_padding_y * 2 + len(rows) * cell_height + (len(rows) - 1) * gap_y
    card_bounds = (64, 36, canvas_width - 64, canvas_height - 36)
    canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 0))

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(card_bounds, radius=48, fill=(255, 255, 255, 255), outline=(224, 229, 236, 255), width=2)

    placements: list[dict[str, Any]] = []
    for row_index, row in enumerate(rows):
        row_width = len(row) * cell_width + (len(row) - 1) * gap_x
        row_left = (canvas_width - row_width) // 2
        row_top = card_padding_y + row_index * (cell_height + gap_y)

        for col_index, sponsor in enumerate(row):
            source = Image.open(sponsor.logo).convert("RGBA")
            bbox = content_bbox(source)
            cropped = source.crop(bbox)
            scale = min(target_logo_height / cropped.height, max_logo_width / cropped.width)
            render_w = int(round(cropped.width * scale))
            render_h = int(round(cropped.height * scale))
            resized = cropped.resize((render_w, render_h), Image.Resampling.LANCZOS)

            cell_left = row_left + col_index * (cell_width + gap_x)
            cell_top = row_top
            x = cell_left + (cell_width - render_w) // 2
            y = cell_top + (cell_height - render_h) // 2
            canvas.alpha_composite(resized, (x, y))

            placements.append(
                {
                    "name": sponsor.name,
                    "url": sponsor.url,
                    "source": str(sponsor.logo.relative_to(ROOT)),
                    "source_size": [source.width, source.height],
                    "source_bbox": list(bbox),
                    "row": row_index,
                    "column": col_index,
                    "cell": {
                        "left": cell_left,
                        "top": cell_top,
                        "right": cell_left + cell_width,
                        "bottom": cell_top + cell_height,
                    },
                    "render": {
                        "left": x,
                        "top": y,
                        "right": x + render_w,
                        "bottom": y + render_h,
                        "width": render_w,
                        "height": render_h,
                    },
                    "scale": scale,
                }
            )

    output.parent.mkdir(parents=True, exist_ok=True)
    report.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)

    result = verify_strip(
        image_path=output,
        placements=placements,
        max_per_row=max_per_row,
        card_bounds=card_bounds,
        min_gap=48,
        max_height_ratio=1.18,
    )
    payload = {
        "ok": result["ok"],
        "output": str(output.relative_to(ROOT)),
        "canvas": {"width": canvas_width, "height": canvas_height},
        "policy": {
            "max_per_row": max_per_row,
            "target_logo_height": target_logo_height,
            "max_logo_width": max_logo_width,
            "min_gap": 48,
            "max_height_ratio": 1.18,
        },
        "placements": placements,
        "checks": result["checks"],
        "errors": result["errors"],
    }
    report.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not payload["ok"]:
        raise SystemExit("sponsor strip verification failed; see " + str(report))
    return payload


def verify_strip(
    *,
    image_path: Path,
    placements: list[dict[str, Any]],
    max_per_row: int,
    card_bounds: tuple[int, int, int, int],
    min_gap: int,
    max_height_ratio: float,
) -> dict[str, Any]:
    errors: list[str] = []
    checks: dict[str, Any] = {}
    image = Image.open(image_path).convert("RGBA")
    alpha_bbox = image.getchannel("A").getbbox()
    checks["image_mode"] = image.mode
    checks["image_size"] = [image.width, image.height]
    checks["alpha_bbox"] = list(alpha_bbox) if alpha_bbox else None
    if image.mode != "RGBA":
        errors.append("output must be RGBA")
    if image.width < 900:
        errors.append("output width is too small for Luma rendering")
    if alpha_bbox is None:
        errors.append("output has no visible pixels")

    row_counts: dict[int, int] = {}
    for placement in placements:
        row_counts[placement["row"]] = row_counts.get(placement["row"], 0) + 1
    checks["row_counts"] = row_counts
    for row, count in row_counts.items():
        if count > max_per_row:
            errors.append(f"row {row} has {count} logos; max is {max_per_row}")

    render_boxes = [placement["render"] for placement in placements]
    for placement in placements:
        box = placement["render"]
        if box["left"] < card_bounds[0] or box["right"] > card_bounds[2] or box["top"] < card_bounds[1] or box["bottom"] > card_bounds[3]:
            errors.append(f"{placement['name']} render box is outside card bounds")

    min_observed_gap = math.inf
    for index, a in enumerate(render_boxes):
        for b in render_boxes[index + 1 :]:
            if intersects(a, b):
                errors.append("logo render boxes overlap")
            same_row = abs((a["top"] + a["bottom"]) / 2 - (b["top"] + b["bottom"]) / 2) < max(a["height"], b["height"])
            if same_row:
                gap = max(b["left"] - a["right"], a["left"] - b["right"])
                min_observed_gap = min(min_observed_gap, gap)
    checks["min_observed_gap"] = None if min_observed_gap is math.inf else min_observed_gap
    if min_observed_gap is not math.inf and min_observed_gap < min_gap:
        errors.append(f"same-row logo gap {min_observed_gap}px is below minimum {min_gap}px")

    heights = [box["height"] for box in render_boxes]
    height_ratio = max(heights) / min(heights) if heights else 0
    checks["render_heights"] = heights
    checks["height_ratio"] = height_ratio
    if height_ratio > max_height_ratio:
        errors.append(f"logo height ratio {height_ratio:.3f} exceeds {max_height_ratio}")

    return {"ok": not errors, "checks": checks, "errors": errors}


def verify_from_report(report: Path) -> dict[str, Any]:
    payload = json.loads(report.read_text(encoding="utf-8"))
    image_path = ROOT / payload["output"]
    result = verify_strip(
        image_path=image_path,
        placements=payload["placements"],
        max_per_row=payload["policy"]["max_per_row"],
        card_bounds=(64, 36, payload["canvas"]["width"] - 64, payload["canvas"]["height"] - 36),
        min_gap=payload["policy"]["min_gap"],
        max_height_ratio=payload["policy"]["max_height_ratio"],
    )
    payload["ok"] = result["ok"]
    payload["checks"] = result["checks"]
    payload["errors"] = result["errors"]
    report.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not result["ok"]:
        raise SystemExit("sponsor strip verification failed; see " + str(report))
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sponsors", type=Path, default=DEFAULT_SPONSORS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--max-per-row", type=int, default=3)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    if args.verify_only:
        payload = verify_from_report(args.report)
    else:
        payload = build_strip(
            sponsors=load_sponsors(args.sponsors),
            output=args.output,
            report=args.report,
            max_per_row=args.max_per_row,
        )
    print(json.dumps({"ok": payload["ok"], "output": payload["output"], "report": str(args.report.relative_to(ROOT))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
