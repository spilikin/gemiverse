# /// script
# requires-python = ">=3.11"
# dependencies = ["pdfplumber>=0.11"]
# ///
"""Generate src/lib/catalog/abrik.json from the ARGE.IK Schlüsselverzeichnis 8a PDF.

Run from the repository root:

    uv run scripts/fetch_abrik.py            # use cached PDF if present
    uv run scripts/fetch_abrik.py --refresh  # re-download

The PDF is the authoritative IK (Institutionskennzeichen) → Krankenkasse
mapping. The catalog routing payloads reference these IKs as routing keys;
having a checked-in label map lets the UI render human-readable names.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

PDF_URL = "https://institut-ba.de/service/schluesselverzeichnisse/S_8a_ABRIK_012.PDF"
VERSION = "012"

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "scripts" / ".cache" / "S_8a_ABRIK_012.PDF"
OUTPUT_PATH = ROOT / "src" / "lib" / "catalog" / "abrik.json"

SKIP_PREFIXES = (
    "Abrechnungs",
    "Bewertungsausschuss",
    "Schlüssel",
    "S_8a_ABRIK",
    "Version:",
    "Weiter auf der nächsten",
)

IK_RE = re.compile(r"^(\d{9})\s+(\d{9})\s+(.+)$")
MULTI_SPACE_RE = re.compile(r"\s+")
SOFT_HYPHEN = "‐"


def download_pdf(refresh: bool) -> None:
    PDF_PATH.parent.mkdir(parents=True, exist_ok=True)
    if PDF_PATH.exists() and not refresh:
        return
    print(f"downloading {PDF_URL}", file=sys.stderr)
    with urllib.request.urlopen(PDF_URL) as resp:  # noqa: S310 — fixed URL
        PDF_PATH.write_bytes(resp.read())


def extract_lines() -> list[str]:
    # x_tolerance=1.5 — the PDF's tightly-kerned name column has gaps under
    # pdfplumber's default x_tolerance=3, which otherwise drops inter-word
    # spaces (e.g. "TechnikerKrankenkasse").
    lines: list[str] = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=1.5) or ""
            lines.extend(text.splitlines())
    return lines


def parse_rows(lines: list[str]) -> dict[str, dict[str, str]]:
    entries: dict[str, dict[str, str]] = {}
    current_key: str | None = None
    name = ""
    join_without_space = False

    def add_chunk(chunk: str) -> None:
        nonlocal name, join_without_space
        ends_with_wrap = chunk.endswith(SOFT_HYPHEN)
        cleaned = chunk[:-1].rstrip() if ends_with_wrap else chunk.rstrip()
        if join_without_space or not name:
            name += cleaned
        else:
            name += " " + cleaned
        join_without_space = ends_with_wrap

    def flush() -> None:
        nonlocal current_key, name, join_without_space
        if current_key is None:
            return
        clean = MULTI_SPACE_RE.sub(" ", name).strip()
        # Remaining inline U+2010 chars are visible word-separators (e.g. "AOK ‐ Die …");
        # normalise to ASCII hyphen for readability.
        clean = clean.replace(SOFT_HYPHEN, "-")
        entries[current_key]["name"] = clean
        current_key = None
        name = ""
        join_without_space = False

    for raw in lines:
        stripped = raw.strip()
        if not stripped or stripped.startswith(SKIP_PREFIXES):
            continue
        m = IK_RE.match(stripped)
        if m:
            flush()
            abrechnungs_ik, kassensitz_ik, name_chunk = m.groups()
            current_key = abrechnungs_ik
            entries[current_key] = {"name": "", "kassensitz_ik": kassensitz_ik}
            add_chunk(name_chunk)
        elif current_key is not None:
            add_chunk(stripped)
    flush()
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="re-download the PDF")
    args = parser.parse_args()

    download_pdf(args.refresh)
    lines = extract_lines()
    entries = parse_rows(lines)

    if len(entries) < 100:
        print(f"error: parsed only {len(entries)} rows, expected >= 100", file=sys.stderr)
        return 1
    bad = [k for k in entries if not re.fullmatch(r"\d{9}", k)]
    if bad:
        print(f"error: non-9-digit IK keys: {bad[:5]}", file=sys.stderr)
        return 1
    empty = [k for k, v in entries.items() if not v["name"]]
    if empty:
        print(f"error: rows with empty name: {empty[:5]}", file=sys.stderr)
        return 1

    payload = {
        "source": PDF_URL,
        "version": VERSION,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "entries": dict(sorted(entries.items())),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, sort_keys=False)
        f.write("\n")

    print(f"wrote {len(entries)} entries to {OUTPUT_PATH.relative_to(ROOT)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
