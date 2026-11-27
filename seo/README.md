# Alluvi SEO workspace (branch: seo-reports)

This branch never merges into `main` (pushing to `main` redeploys the live site).

## Weekly routine — every Monday 08:00 Africa/Lagos
A cloud agent reads the latest exports, researches live Google UK SERPs and writes the weekly keyword report.

## What to upload each week (GitHub → branch `seo-reports` → `seo/inputs/YYYY-MM-DD/` → Add file → Upload)
1. **Google Search Console** → Performance → Search results → last 7 days, *Compare to previous period* → Export CSV (Queries.csv, Pages.csv, Countries.csv, Devices.csv).
2. **Google Keyword Planner** → Discover new keywords / Get search volume → location United Kingdom → Download keyword ideas (CSV).

If no exports are uploaded the report still runs, using SERP research only.

## Outputs
- `seo/reports/YYYY-MM-DD.md` — the weekly report
- `seo/tracked-keywords.md` — the keyword → URL map the agent maintains
- A Claude Doc copy titled "Alluvi SEO Weekly Report — YYYY-MM-DD"
