# SEO Programme — alluvihealthcare.co

> The 30-day plan to get every product and core page of **https://alluvihealthcare.co** indexed,
> trusted, and ranking in Google UK. Owner: site owner (approver). Executor: Claude Code.

## Files in this folder

| File | What it is | Who updates it |
|---|---|---|
| [PLAN.md](PLAN.md) | The 30-day plan: goals, KPIs, rules, the keyword→URL map and the day-by-day tasks | Changed only when the plan changes |
| [TRACKER.md](TRACKER.md) | Live status: tasks, approvals, KPIs, rankings, backlinks, indexing, change log | Updated at the end of **every** task |
| [PROMPTS.md](PROMPTS.md) | One copy-paste prompt per task, in PLAN order | Changed only when a prompt is improved |
| `drafts/` | Copy waiting for approval (created by tasks) | Claude writes, owner approves |
| `audits/` | Audit and analysis reports (created by tasks) | Claude |
| `reports/` | Week reviews and the Day-30 report (created by tasks) | Claude |

## How to run a day (the routine)

1. Open [TRACKER.md](TRACKER.md) and find today's day number and task IDs.
2. Start a new Claude Code session and paste **§0 SEO session primer** from [PROMPTS.md](PROMPTS.md).
3. Paste the task prompt(s) for today, **one at a time**.
4. Claude writes drafts to `docs/seo/drafts/`. Read them, edit them if you want, then set
   `Status: APPROVED` in the draft's header (or reply "approved" in chat).
5. Only approved drafts are shipped. A ship task builds, runs the quality gates and pushes to `main`.
   **A push to `main` deploys the live site** (GitHub Actions → cPanel).
6. Do the **You** items for that day, such as Search Console steps and link outreach.

## The weekly keyword report (automatic)

- A cloud routine runs **every Monday at 08:00 Africa/Lagos** (07:00 UTC):
  <https://claude.ai/code/routines/trig_01VLsZWg5KDgZFXQDBQw192t>
- **Inputs:** every weekend, upload your Search Console export (Performance → last 7 days → compare to
  previous period → Export) and your Google Keyword Planner CSV (United Kingdom) to the
  **`seo-reports` branch** at `seo/inputs/YYYY-MM-DD/`.
- **Outputs:** a Claude Doc ("Alluvi SEO Weekly Report — date") and `seo/reports/YYYY-MM-DD.md` on the
  same branch. The tracked-keyword list is `seo/tracked-keywords.md` on that branch.
- The `seo-reports` branch is **never merged** into `main`.
- Weekly reports land on Days 1, 8, 15, 22 and 29. The week-review task on Days 7, 14 and 21 uses the latest one.

## Non-negotiables (summary; full rules are in PLAN §3)

- Research-use-only language everywhere. No dosing, human-use, weight-loss or medical claims, and
  **never target such keywords**.
- Only **earned links from real sites**. No paid links, PBNs, link robots or automated submissions.
- Do not invent claims, prices, test results or reviews. Janoshik claims only where a certificate exists.
- Nothing is published without the owner's approval.
