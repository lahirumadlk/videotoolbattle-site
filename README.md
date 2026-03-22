# videotoolbattle-site

## Pricing Scraper

Use the scraper to pull latest pricing-related signals from official tool pages defined in `assets/affiliate-links.js` (`OFFICIAL_LINKS` map).

```bash
python3 scripts/scrape_tool_pricing.py
```

Outputs:

- `data/latest-tool-pricing.json`
- `data/latest-tool-pricing.md`

Useful options:

```bash
# quick smoke test on first 3 tools
python3 scripts/scrape_tool_pricing.py --limit 3

# custom output paths
python3 scripts/scrape_tool_pricing.py \
  --output-json data/pricing-snapshot.json \
  --output-md data/pricing-snapshot.md
```
