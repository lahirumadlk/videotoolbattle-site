#!/usr/bin/env python3
import argparse
import datetime as dt
import html
import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple


DEFAULT_LINKS_FILE = Path("assets/affiliate-links.js")
DEFAULT_OUTPUT_JSON = Path("data/latest-tool-pricing.json")
DEFAULT_OUTPUT_MD = Path("data/latest-tool-pricing.md")

KEY_DISPLAY_OVERRIDES = {
    "invideo-ai": "InVideo AI",
    "invideo": "InVideo",
    "heygen": "HeyGen",
    "runway": "Runway",
    "luma": "Luma Dream Machine",
    "pika": "Pika",
    "capcut": "CapCut",
    "veed": "VEED",
    "synthesia": "Synthesia",
    "colossyan": "Colossyan",
    "kaiber": "Kaiber",
    "descript": "Descript",
    "fliki": "Fliki",
}

PRICING_KEYWORDS = (
    "price",
    "pricing",
    "starts at",
    "from",
    "/mo",
    "/month",
    "/yr",
    "/year",
    "per month",
    "per year",
    "usd",
)

MONEY_RE = re.compile(
    r"(?i)(?:USD\s*)?(?:\$|EUR\s*|€|GBP\s*|£)\s*\d{1,4}(?:,\d{3})*(?:\.\d{1,2})?(?:\s*(?:/|per)\s*(?:month|mo|year|yr|user|seat))?"
)

PLAN_SIGNAL_RE = re.compile(
    r"(?i)\b(pricing|plan|starts at|from|billed|per month|per year|monthly|yearly|free)\b"
)


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1")


def extract_official_links(js_path: Path) -> Dict[str, str]:
    raw = read_text_file(js_path)
    block_match = re.search(r"const\s+OFFICIAL_LINKS\s*=\s*\{(.*?)\};", raw, re.S)
    if not block_match:
        raise ValueError(f"Could not locate OFFICIAL_LINKS in {js_path}")

    block = block_match.group(1)
    pairs = re.findall(r'"([^"]+)"\s*:\s*"([^"]*)"', block)
    links: Dict[str, str] = {}
    for key, value in pairs:
        value = value.strip()
        if value:
            links[key] = value
    return links


def normalize_url(value: str) -> str:
    value = value.strip()
    if not value:
        return value
    parsed = urllib.parse.urlsplit(value)
    if not parsed.scheme:
        value = f"https://{value}"
        parsed = urllib.parse.urlsplit(value)
    if not parsed.netloc:
        return value
    path = parsed.path or "/"
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, ""))


def build_candidate_urls(base_url: str) -> List[str]:
    base_url = normalize_url(base_url)
    parsed = urllib.parse.urlsplit(base_url)
    root = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))

    candidates = [
        base_url,
        urllib.parse.urljoin(root, "pricing"),
        urllib.parse.urljoin(root, "plans"),
    ]

    if parsed.path and parsed.path not in ("", "/"):
        candidates.append(urllib.parse.urljoin(root, parsed.path.strip("/") + "/pricing"))

    deduped: List[str] = []
    seen = set()
    for url in candidates:
        key = url.rstrip("/")
        if key not in seen:
            seen.add(key)
            deduped.append(url)
    return deduped


def fetch_url(url: str, timeout: int, verify_tls: bool = True) -> Dict[str, str]:
    context = None
    if not verify_tls:
        context = ssl._create_unverified_context()

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "VideoToolBattlePricingBot/1.0 (+https://videotoolbattle.com)"
        },
    )

    with urllib.request.urlopen(req, timeout=timeout, context=context) as response:
        content_type = response.headers.get("Content-Type", "")
        charset = "utf-8"
        charset_match = re.search(r"charset=([^\s;]+)", content_type, re.I)
        if charset_match:
            charset = charset_match.group(1).strip("'\"")
        body = response.read().decode(charset, errors="replace")
        return {
            "status_code": str(response.getcode() or 200),
            "final_url": response.geturl(),
            "content_type": content_type,
            "body": body,
            "tls_verified": "true" if verify_tls else "false",
        }


def extract_title(html_doc: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html_doc, re.I | re.S)
    return html.unescape(match.group(1)).strip() if match else ""


def extract_meta_description(html_doc: str) -> str:
    patterns = [
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html_doc, re.I | re.S)
        if match:
            return html.unescape(match.group(1)).strip()
    return ""


def html_to_text(html_doc: str) -> str:
    cleaned = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html_doc)
    cleaned = re.sub(
        r"(?i)</?(p|div|li|h1|h2|h3|h4|h5|h6|tr|td|section|article|header|footer|main|br)[^>]*>",
        "\n",
        cleaned,
    )
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"[ \t\r\f\v]+", " ", cleaned)
    cleaned = re.sub(r"\n+", "\n", cleaned)
    return cleaned.strip()


def add_snippet(snippets: List[str], seen: set, candidate: str, max_snippets: int) -> None:
    candidate = re.sub(r"\s+", " ", candidate).strip(" .,:;|-")
    if len(candidate) < 12:
        return
    if len(candidate) > 240:
        return
    normalized = candidate.lower()
    if normalized in seen:
        return
    if not PLAN_SIGNAL_RE.search(candidate) and not MONEY_RE.search(candidate):
        return
    seen.add(normalized)
    snippets.append(candidate)
    if len(snippets) > max_snippets:
        snippets.pop()


def trim_around_match(text: str, match_start: int, match_end: int, radius: int = 70) -> str:
    start = max(0, match_start - radius)
    end = min(len(text), match_end + radius)
    snippet = text[start:end]
    return snippet


def extract_pricing_snippets(text: str, max_snippets: int) -> List[str]:
    snippets: List[str] = []
    seen = set()

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line in lines:
        if len(snippets) >= max_snippets:
            break
        for money_match in MONEY_RE.finditer(line):
            snippet = trim_around_match(line, money_match.start(), money_match.end())
            add_snippet(snippets, seen, snippet, max_snippets)
            if len(snippets) >= max_snippets:
                break

    if len(snippets) < max_snippets:
        for line in lines:
            if len(snippets) >= max_snippets:
                break
            if len(line) > 220:
                continue
            lower_line = line.lower()
            if PLAN_SIGNAL_RE.search(line) and ("free" in lower_line or "pricing" in lower_line or "plan" in lower_line):
                add_snippet(snippets, seen, line, max_snippets)
                if len(snippets) >= max_snippets:
                    break

    return snippets[:max_snippets]


def extract_price_points(text: str, max_items: int = 10) -> List[str]:
    items: List[str] = []
    seen = set()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if len(items) >= max_items:
            break
        for match in MONEY_RE.finditer(line):
            amount = match.group(0).strip()
            amount = re.sub(r"(?<=[$€£])\s+", "", amount)
            amount = re.sub(r"\s+", " ", amount)
            amount = re.sub(r"(?i)\s+per\s+month", "/month", amount)
            amount = re.sub(r"(?i)\s+per\s+year", "/year", amount)
            amount = re.sub(r"(?i)\s+per\s+user", "/user", amount)
            amount = re.sub(r"(?i)\s+per\s+seat", "/seat", amount)
            suffix = ""
            tail = line[match.end() : match.end() + 48].lower()
            if "billed yearly" in tail:
                suffix = " billed yearly"
            elif "billed annually" in tail:
                suffix = " billed annually"
            elif "per month" in tail and "/month" not in amount:
                suffix = " per month"
            elif "per year" in tail and "/year" not in amount:
                suffix = " per year"

            point = f"{amount}{suffix}"
            normalized = point.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            items.append(point)
            if len(items) >= max_items:
                break
    return items


def display_name_for_key(key: str) -> str:
    if key in KEY_DISPLAY_OVERRIDES:
        return KEY_DISPLAY_OVERRIDES[key]
    return key.replace("-", " ").title()


def scrape_tool(
    key: str,
    base_url: str,
    timeout: int,
    delay_seconds: float,
    max_snippets: int,
    insecure_fallback: bool,
) -> Dict[str, object]:
    attempts: List[Dict[str, object]] = []
    all_snippets: List[str] = []
    title = ""
    description = ""
    all_price_points: List[str] = []
    fetched_sources = []

    for url in build_candidate_urls(base_url):
        result: Dict[str, object] = {
            "url": url,
            "fetched_at_utc": utc_now_iso(),
        }
        try:
            payload = fetch_url(url, timeout=timeout, verify_tls=True)
            body = str(payload["body"])
            body_text = html_to_text(body)
            snippets = extract_pricing_snippets(body_text, max_snippets=max_snippets)
            price_points = extract_price_points(body_text, max_items=8)

            if not title:
                title = extract_title(body)
            if not description:
                description = extract_meta_description(body)

            for snippet in snippets:
                if snippet not in all_snippets:
                    all_snippets.append(snippet)
            for item in price_points:
                if item not in all_price_points:
                    all_price_points.append(item)

            result.update(
                {
                    "status": "ok",
                    "status_code": int(payload["status_code"]),
                    "final_url": payload["final_url"],
                    "snippet_count": len(snippets),
                    "tls_verified": payload["tls_verified"] == "true",
                }
            )
            fetched_sources.append(str(payload["final_url"]))
        except urllib.error.HTTPError as exc:
            result.update({"status": "http_error", "status_code": exc.code, "error": str(exc)})
        except urllib.error.URLError as exc:
            reason = str(exc.reason)
            should_retry_insecure = insecure_fallback and (
                "CERTIFICATE_VERIFY_FAILED" in reason or "certificate verify failed" in reason.lower()
            )
            if should_retry_insecure:
                try:
                    payload = fetch_url(url, timeout=timeout, verify_tls=False)
                    body = str(payload["body"])
                    body_text = html_to_text(body)
                    snippets = extract_pricing_snippets(body_text, max_snippets=max_snippets)
                    price_points = extract_price_points(body_text, max_items=8)

                    if not title:
                        title = extract_title(body)
                    if not description:
                        description = extract_meta_description(body)

                    for snippet in snippets:
                        if snippet not in all_snippets:
                            all_snippets.append(snippet)
                    for item in price_points:
                        if item not in all_price_points:
                            all_price_points.append(item)

                    result.update(
                        {
                            "status": "ok",
                            "status_code": int(payload["status_code"]),
                            "final_url": payload["final_url"],
                            "snippet_count": len(snippets),
                            "tls_verified": False,
                            "warning": "tls_verification_skipped",
                        }
                    )
                    fetched_sources.append(str(payload["final_url"]))
                except Exception as retry_exc:
                    result.update({"status": "url_error", "error": reason, "retry_error": str(retry_exc)})
            else:
                result.update({"status": "url_error", "error": reason})
        except TimeoutError as exc:
            result.update({"status": "timeout", "error": str(exc)})
        except Exception as exc:
            result.update({"status": "error", "error": str(exc)})

        attempts.append(result)
        if delay_seconds > 0:
            time.sleep(delay_seconds)

    return {
        "key": key,
        "name": display_name_for_key(key),
        "base_url": normalize_url(base_url),
        "checked_urls": attempts,
        "page_title": title,
        "page_description": description,
        "pricing_snippets": all_snippets[:max_snippets],
        "price_points": all_price_points[:8],
        "source_urls": fetched_sources,
        "has_pricing_signal": len(all_snippets) > 0,
    }


def write_json(path: Path, payload: Dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload: Dict[str, object]) -> None:
    lines = [
        "# Latest Tool Pricing Signals",
        "",
        f"- Generated (UTC): {payload['generated_at_utc']}",
        f"- Total tools: {payload['tool_count']}",
        f"- Tools with pricing signals: {payload['tools_with_signals']}",
        "",
    ]

    for tool in payload["tools"]:
        lines.append(f"## {tool['name']} (`{tool['key']}`)")
        lines.append(f"- Base URL: {tool['base_url']}")
        lines.append(f"- Pricing signals found: {'yes' if tool['has_pricing_signal'] else 'no'}")
        if tool["source_urls"]:
            lines.append(f"- Source URLs: {', '.join(tool['source_urls'])}")
        if tool["pricing_snippets"]:
            lines.append("- Snippets:")
            for snippet in tool["pricing_snippets"]:
                lines.append(f"  - {snippet}")
        else:
            lines.append("- Snippets: none detected")
        if tool["price_points"]:
            lines.append(f"- Price points: {', '.join(tool['price_points'])}")
        else:
            lines.append("- Price points: none detected")
        lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape public tool pages for latest pricing-related signals."
    )
    parser.add_argument(
        "--links-file",
        type=Path,
        default=DEFAULT_LINKS_FILE,
        help=f"JS file containing OFFICIAL_LINKS map (default: {DEFAULT_LINKS_FILE})",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=DEFAULT_OUTPUT_JSON,
        help=f"Where to write JSON output (default: {DEFAULT_OUTPUT_JSON})",
    )
    parser.add_argument(
        "--output-md",
        type=Path,
        default=DEFAULT_OUTPUT_MD,
        help=f"Where to write Markdown report (default: {DEFAULT_OUTPUT_MD})",
    )
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds.")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.6,
        help="Delay between requests in seconds.",
    )
    parser.add_argument(
        "--max-snippets",
        type=int,
        default=5,
        help="Max pricing snippets saved per tool.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit number of tools for quick test runs (0 means all).",
    )
    parser.set_defaults(insecure_fallback=True)
    parser.add_argument(
        "--allow-insecure-fallback",
        dest="insecure_fallback",
        action="store_true",
        help="Retry without TLS verification if cert validation fails (default: enabled).",
    )
    parser.add_argument(
        "--no-insecure-fallback",
        dest="insecure_fallback",
        action="store_false",
        help="Do not retry without TLS verification.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.links_file.exists():
        print(f"Links file not found: {args.links_file}", file=sys.stderr)
        return 1

    official_links = extract_official_links(args.links_file)
    items: List[Tuple[str, str]] = list(official_links.items())
    if args.limit > 0:
        items = items[: args.limit]

    tools = []
    for index, (key, url) in enumerate(items, start=1):
        print(f"[{index}/{len(items)}] scraping {key}: {url}")
        tool = scrape_tool(
            key=key,
            base_url=url,
            timeout=args.timeout,
            delay_seconds=args.delay,
            max_snippets=args.max_snippets,
            insecure_fallback=args.insecure_fallback,
        )
        tools.append(tool)

    payload = {
        "generated_at_utc": utc_now_iso(),
        "tool_count": len(tools),
        "tools_with_signals": sum(1 for t in tools if t["has_pricing_signal"]),
        "tools": tools,
    }

    write_json(args.output_json, payload)
    write_markdown(args.output_md, payload)
    print(f"Wrote JSON: {args.output_json}")
    print(f"Wrote Markdown: {args.output_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
