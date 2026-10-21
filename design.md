# design.md — Monthly Receipt · Ledger

> Locked design system for every page of the app. Written by `hallmark redesign` (scope: app), 2026-10-21.
> Pages **share** this system; they do not diversify from each other. Amend this file first, then the code.

## Genre

**Editorial — ledger book.** A personal accounting book, not a SaaS dashboard.
Hairline rules instead of card borders and shadows, generous whitespace, numbers carry the page.
Mode: **Operate** — scanability and consistency outrank expression; character lives in type, rules and the paper tone.

## Macrostructure family

| Page | Route | Macrostructure | Notes |
|---|---|---|---|
| Dashboard | `/` | **Stat-Led** | One big "คงเหลือเดือนนี้" figure first, then a ruled line of supporting figures, then the category breakdown and chart. |
| Expenses | `/expenses` | **Ledger table** | Hairline rows, total row with a double rule under the amount. Mobile: vertical ruled list. |
| Installments | `/installments` | **Ledger table** | Same as Expenses. Completed plans read as settled (muted ink + "ชำระครบ"), never via opacity. |
| SalaryHistory | `/salary-history` | **Ledger table + chart** | Latest year marked with an accent rule on the left, not a fill. |
| MonthlySummary | `/monthly-summary` | **Catalogue** | Uniform 12-month grid, each cell a ruled mini-ledger. Empty months say "ยังไม่มีข้อมูล" in muted ink. |
| Budget | `/budget` | **Long Document** | Form laid out as stacked numbered sections divided by rules; one save action at the end. |

Navigation: **N3 side-rail** on desktop (≥ 900px), the existing temporary drawer on mobile. No footer.

## Theme

Source of truth: `frontend/src/styles/tokens.css` (OKLCH). `frontend/src/theme.js` mirrors the same values as hex
because MUI's `alpha()` / `darken()` cannot parse `oklch()`. If you change one, change both.

| Token | OKLCH | Hex mirror | Use |
|---|---|---|---|
| `--color-paper` | `oklch(97% 0.012 85)` | `#F9F5EC` | page background |
| `--color-paper-2` | `oklch(94.5% 0.014 82)` | `#F2ECE3` | table head, hover row, side-rail |
| `--color-paper-3` | `oklch(91% 0.016 80)` | `#E7E0D6` | pressed / selected surface |
| `--color-ink` | `oklch(20% 0.012 60)` | `#1A1511` | body text, figures (16.6:1) |
| `--color-ink-2` | `oklch(38% 0.012 65)` | `#47413C` | secondary text (9.2:1) |
| `--color-muted` | `oklch(50% 0.012 70)` | `#68625C` | labels, captions (5.5:1) |
| `--color-rule` | `oklch(84% 0.010 80)` | `#CECAC3` | hairlines |
| `--color-rule-strong` | `oklch(70% 0.012 75)` | `#A39D96` | total rules, input borders (non-text) |
| `--color-accent` | `oklch(45% 0.12 255)` | `#1F5596` | ledger-ink blue: active nav, links, focus ring, primary button (6.9:1) |
| `--color-accent-soft` | `oklch(94% 0.025 255)` | `#E0ECFC` | active nav background only |
| `--color-positive` | `oklch(46% 0.11 150)` | `#1D6835` | income, surplus, paid (6.3:1) |
| `--color-positive-soft` | `oklch(95% 0.03 150)` | `#E1F5E4` | paid row tint |
| `--color-negative` | `oklch(50% 0.16 28)` | `#AC312A` | deficit, over budget, delete (6.0:1) |
| `--color-negative-soft` | `oklch(95% 0.03 28)` | `#FFE7E3` | over-budget tint |
| `--color-warning` | `oklch(50% 0.11 60)` | `#905211` | near limit (5.7:1, passes AA) |
| `--color-warning-soft` | `oklch(95% 0.035 70)` | `#FEEBD6` | near-limit tint |

Rules: no pure `#000` / `#fff`. Accent ≤ 5% of any viewport. Contrast ratios above are against `--color-paper`.

**Dark mode (defined, not yet implemented):** paper `oklch(18% 0.010 70)`, paper-2 `oklch(22% 0.010 70)`,
ink `oklch(93% 0.010 85)`, muted `oklch(72% 0.010 80)`, rule `oklch(32% 0.010 75)`, accent `oklch(72% 0.11 255)`,
positive `oklch(72% 0.12 150)`, negative `oklch(70% 0.14 28)`, warning `oklch(76% 0.11 70)`.

## Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / headings | **Noto Serif Thai** | 600 | roman only — headings are never italic |
| Body / UI | **IBM Plex Sans Thai** | 400 / 500 / 600 | |
| Figures | **IBM Plex Mono** | 400 / 500 | `font-variant-numeric: tabular-nums`, right-aligned in tables |

Scale (rem): display 2.5 (mobile 2) · h1 1.75 (mobile 1.5) · h2 1.25 · h3 1.05 · body 1 · small 0.875 · caption 0.8125.
Inputs stay at 16px (iOS zoom). Line-height 1.6 body, 1.25 headings. Each page has exactly one `h1`.

## Spacing

4-pt base via MUI `spacing(n)` = `n × 8px`. Page gutter 16px mobile / 32px desktop. Section gap 40px.
Max content width 1120px. Radius: 4px (inputs, buttons), 0 for ledger surfaces.

## Motion

Minimal. One 160ms opacity fade on route content and dialogs; hover colour transitions 120ms.
`prefers-reduced-motion: reduce` → transitions off, state changes stay visible.

## Microinteractions

All interactive controls ship 8 states: default · hover (paper-2) · `:focus-visible` (2px accent outline, 2px offset) ·
active (paper-3) · disabled (muted ink, no opacity-only) · loading (inline spinner + label) · error (negative text + message) ·
success (Snackbar, top-center on mobile so it never covers the FAB). Touch targets ≥ 44px, list items ≥ 48px.

## CTA voice

Short Thai verbs, no exclamation marks: "บันทึก", "เพิ่มรายการ", "ลบ", "ยกเลิก". Destructive actions confirm in a dialog
that names the item. Every icon-only button has an `aria-label` in Thai.

## Per-page allowances

- Dashboard may use one display-size figure; no other page does.
- Charts (Dashboard, SalaryHistory) use accent for the current series and `--color-rule-strong` for the rest.
- Status colour (positive / negative / warning) appears on text and thin rules; soft tints only on whole rows.

## Must share / May differ

**Must share:** tokens, fonts, side-rail, page header (h1 + one-line description + actions on the right), ledger row
style, total-row double rule, focus ring, dialog style, date format `dd/mm/yyyy` (พ.ศ.).

**May differ:** macrostructure (table above), chart presence, number of figures in the header strip.

## Exports

- **CSS:** `frontend/src/styles/tokens.css` (`:root` custom properties).
- **MUI:** `frontend/src/theme.js` (hex mirror).
- **Tailwind @theme / DTCG / shadcn:** not used in this project; derive from the table above if ever needed.
