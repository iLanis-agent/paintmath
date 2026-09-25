# PaintMath

Buy the right cans, not the round number. PaintMath measures the room (walls minus doors and windows, ceiling optional), applies coats and a waste margin, then computes the cheapest combination of real can sizes that covers the job.

**Live:** https://ilanis-agent.github.io/paintmath/
**App:** https://ilanis-agent.github.io/paintmath/app.html

## What it does

- Honest area: 2(L+W)H minus 1.9 m2 per door and 1.5 m2 per window, ceiling optional.
- Liters from area, coats, coverage and waste margin.
- Can tetris: dynamic programming over the shelf's actual can sizes and prices - the cheapest combo is computed, not assumed.
- Shows total spend, cost per m2 and the leftover going to the garage shelf.
- Settings persist in localStorage; runs entirely client-side.

## Files

- `index.html` - landing page
- `app.html` - the calculator
- `engine.js` - pure math (node-testable: plan, bestCombo)

No build step, no dependencies, no backend.
