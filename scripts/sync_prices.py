#!/usr/bin/env python3
"""Write prices from data/prices.json into the HTML pages.

Every element like <span data-price="runway">...</span> gets its text from
prices.json, so a price fixed once updates everywhere. Formats (data-format):
  (none)      Starts at $15/mo (Standard, billed monthly; $12/mo billed yearly).
  short       $15/mo
  short-plan  $15/mo (Standard)

The JSON-LD copies of priced text are rebuilt too: FAQ answers from the visible
FAQ, and the Article description from the quick answer.

Usage:
  python3 scripts/sync_prices.py          rewrite pages
  python3 scripts/sync_prices.py --check  exit 1 if any page is out of sync
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICES = ROOT / "data" / "prices.json"
PAGES = [ROOT / "index.html", *sorted((ROOT / "battles").glob("*.html"))]

SPAN_RE = re.compile(
    r'(<span data-price="(?P<key>[a-z0-9-]+)"(?: data-format="(?P<fmt>[a-z-]+)")?>)(?P<text>.*?)(</span>)'
)
DETAILS_RE = re.compile(r"(?s)<summary>(.*?)</summary>\s*<p>(.*?)</p>")
QUICK_RE = re.compile(r'(?s)<div class="quick-answer"><strong>Quick answer:</strong>\s*(.*?)</div>')
JSON_STRING = r'"(?:[^"\\]|\\.)*"'


def money(value):
    return f"${value:g}" if value == int(value) else f"${value:.2f}"


def per(entry):
    return f"/{entry['unit']}/mo" if entry.get("unit") else "/mo"


def render(entry, fmt):
    headline = entry["monthly_price"] if entry["billing"] != "yearly" else entry["yearly_monthly_price"]
    price = money(headline) + per(entry)
    if fmt == "short":
        return price
    if fmt == "short-plan":
        return f"{price} ({entry['plan']})"
    details = entry["plan"]
    if entry["billing"]:
        details += f", billed {entry['billing']}"
    if entry["billing"] == "monthly" and entry.get("yearly_monthly_price"):
        details += f"; {money(entry['yearly_monthly_price'])}{per(entry)} billed yearly"
    if entry.get("note"):
        details += f"{'; ' if details != entry['plan'] else ', '}{entry['note']}"
    return f"Starts at {price} ({details})."


def plain(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def json_str(text):
    return json.dumps(text, ensure_ascii=False)


def sync_page(source, tools):
    def fill(match):
        key, fmt = match.group("key"), match.group("fmt")
        if key not in tools:
            raise SystemExit(f"Unknown price key {key!r}")
        return match.group(1) + html.escape(render(tools[key], fmt), quote=False) + match.group(5)

    out = SPAN_RE.sub(fill, source)

    for question, answer in DETAILS_RE.findall(out):
        if "data-price=" not in answer:
            continue
        name = re.escape(json_str(plain(question)))
        out = re.sub(
            rf'("name": {name},\s*"acceptedAnswer": \{{\s*"@type": "Answer",\s*"text": ){JSON_STRING}',
            lambda m: m.group(1) + json_str(plain(answer)),
            out,
        )

    quick = QUICK_RE.search(out)
    if quick and "data-price=" in quick.group(1):
        out = re.sub(
            rf'("@type": "Article",[^{{}}]*?"description": ){JSON_STRING}',
            lambda m: m.group(1) + json_str(plain(quick.group(1))),
            out,
            count=1,
        )
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="fail if pages are out of sync")
    args = parser.parse_args()

    tools = json.loads(PRICES.read_text(encoding="utf-8"))["tools"]
    stale = []
    for page in PAGES:
        source = page.read_text(encoding="utf-8")
        synced = sync_page(source, tools)
        if synced == source:
            continue
        stale.append(page.relative_to(ROOT))
        if not args.check:
            page.write_text(synced, encoding="utf-8")

    if args.check and stale:
        print("Out of sync with data/prices.json (run python3 scripts/sync_prices.py):")
        for path in stale:
            print(f"  {path}")
        return 1
    print(f"{'Checked' if args.check else 'Updated'}: {len(stale) if not args.check else len(PAGES)} page(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
