# University Budget Studio: design review

Reviewed 13 September 2026 by a separate design-review agent in three sequential rounds. All three scores exceed the requested 80% threshold.

## Baseline and rubric

Reference pages: Home, About, Projects and Blog. Their shared `css/dev.css` defines the core theme: `#0C0C0C` background, `#CCCCCC` text, `#26BC89` accents, JetBrains Mono/monospace type, left-aligned wrapping navigation, white hover/focus states and 4px controls. Content pages add `#999999` metadata, `#3D3D3D` dividers, transparent sections, underlined titles and restrained spacing.

The same weighted rubric was used throughout. A wider layout is appropriate for the budget dashboard, but departures from the core reading-column composition still affect layout fidelity.

| Round | Palette /30 | Typography /20 | Navigation /15 | Layout and spacing /20 | Controls /15 | Total /100 |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 30 | 19 | 15 | 15 | 14 | **93** |
| 2 | 30 | 20 | 15 | 17 | 14 | **96** |
| 3 | 30 | 20 | 15 | 17 | 15 | **97** |

## Review evidence and changes

1. **Initial integration:** inspected the new HTML/CSS/JS and compared desktop screenshots with Projects. Direct reuse of `dev.css` preserved colors, typography and navigation. Recommended reducing the 78rem content cap and 3rem main balance, and left-aligning net movement when the mobile summary wraps.
2. **Layout refinement:** verified the 72rem content cap, 2.5rem balance cap and mobile alignment in source plus desktop and 390px screenshots. Headings, totals and month controls remained readable. No further theme changes were required; interactive and lower-page states were reserved for round 3.
3. **Interactive states:** inspected expanded payments, categories, support sections, visible white keyboard focus and narrow 320px category wrapping. Found that native progress styling hid the green filled portions of spending bars. After adding `appearance: none`, a neutral background and no border, inspected another screenshot confirming proportional green fills. No unresolved theme defects remained.

The integration agent additionally reported matching computed background/accent/font values, Enter/Space disclosure operation, all 13 months and 122 payment rows matching the supplied source, and no horizontal overflow at 320px, 390px or 768px.

Local screenshots used: `.cache/budget-review/reference.png`, `round1-desktop.png`, `round2-desktop.png`, `round2-mobile.png`, `round2-mobile-month.png`, `round3-category-focus.png`, `round3-payments.png`, `round3-support.png`, `round3-mobile-payments.png`, `narrow-category.png` and `round3-bars-fixed.png`. These are local review evidence, not deployed site assets.

## Ponytail follow-up

The final audit retained native selects, disclosures, progress bars and printing;
no framework or build dependencies were added. CSS stays in `css/`, browser logic
and data in `js/`. Removed a redundant payment wrapper, unused class and runtime
insertion of static explanatory text; consolidated CSS rules and removed an
unnecessary specificity override. The supplied reference project remains intact
and is excluded from the Cloudflare asset deployment. The Node check passes,
and downloaded JSON matches the recovered budget data exactly.

## Review limits

Scores are a structured visual judgment supported by source inspection and screenshots, not a mathematical pixel-match percentage. The remaining three-point layout deduction reflects the dashboard's intentionally wider, denser composition. This review does not certify financial forecasts, current prices, every browser or a complete accessibility audit. Runnable budget checks are in `tests/budget-studio.mjs`.
