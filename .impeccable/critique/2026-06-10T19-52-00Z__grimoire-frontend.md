---
target: grimoire frontend
total_score: 21
p0_count: 0
p1_count: 2
timestamp: 2026-06-10T19-52-00Z
slug: grimoire-frontend
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Spinner "Loading…" everywhere but no skeleton states; editor autosave status invisible |
| 2 | Match System / Real World | 3 | Language is natural; "Grimoire" metaphor is well-carried throughout |
| 3 | User Control and Freedom | 2 | TipTap undo works; but no visible autosave confirmation, unclear if navigation from /write loses a draft |
| 4 | Consistency and Standards | 3 | Strong token system; eyebrow-style uppercase labels applied inconsistently across surfaces |
| 5 | Error Prevention | 2 | Basic form validation present; no navigation-away guard on the editor |
| 6 | Recognition Rather Than Recall | 2 | Post management .icons button are icon-only; keyboard shortcuts nowhere discoverable |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, no command palette, no bulk actions; single rigid path for all tasks |
| 8 | Aesthetic and Minimalist Design | 3 | Generally clean; minor visual noise from systematic uppercase section label overuse |
| 9 | Error Recovery | 2 | Error states exist; quality of error messaging uneven across flows |
| 10 | Help and Documentation | 1 | No tooltips on icon-only elements, no help system, no shortcut reference |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Not a clearcut "AI made this" — the dual-theme palette plus geek theme are genuine differentiators. Second-order risk: systematic uppercase-tracked labels as hierarchy vocabulary throughout the app (.section-h h2, .side-card-head, .foot-col h4, .sidebar-section-head, etc.) is the AI grammar pattern at one tier deeper.

**Deterministic scan**: 7 findings. All 4 side-tab border detections are false positives (blockquotes and semantic warning callouts — legitimate uses). 3 layout transitions: .read-progress transition:width (false positive — position:fixed), .gif-panel transition:max-height (genuine), .xp-bar-fill transition:width (minor).

## Overall Impression

Strong design identity undermined by two silent accessibility failures. The three-theme system and terminal-green dark mode are genuine differentiators. Fix prefers-reduced-motion and focus indicators first; then address the section-label vocabulary.

## What's Working

1. Three-theme system is genuinely distinctive — purple/lavender light, terminal-green dark, grid-line geek.
2. Reading experience is thoughtfully scaled — 760px max-width, 17px/1.8 leading, three layout modes.
3. Token system is well-structured — semantic role naming, consistent color-mix(in oklab) usage, clean multi-theme coherence.

## Priority Issues

**[P1] No prefers-reduced-motion support**: ~12 unguarded continuous animations (aurora, grid drift, scan sweep, feedIn, cursor blinks, heartpop, pulse). Vestibular/epilepsy risk. Fix: @media (prefers-reduced-motion: reduce) block — disable continuous animations, crossfade entries.

**[P1] No keyboard focus indicators**: outline:none blanket on all interactive elements (buttons, links, feed rows, cards). No :focus-visible replacement. Tab navigation is invisible. Fix: global button:focus-visible, a:focus-visible rule with outline: 2px solid var(--accent); outline-offset: 3px.

**[P2] Uppercase-tracked section labels as systematic hierarchy**: .section-h h2, .side-card-head, .foot-col h4, .sidebar-section-head, .mob-disc-label, .desktop-hero-eyebrow, .feed-count-label all use the same small-caps-tracked vocabulary. Replaces a real type scale with AI grammar. Fix: weight/size hierarchy; reserve tracking for truly categorical labels only.

**[P2] Icon-only interactive elements without accessible labels**: Post management .post-row .icons buttons, mobile header icons, engagement bar buttons — no aria-label, no tooltip. Fix: aria-label on all icon-only buttons.

**[P2] .gif-panel max-height transition**: layout thrash on animation. Fix: grid-template-rows: 0fr -> 1fr approach.

## Persona Red Flags

**Sam (Accessibility-Dependent)**: No visible focus rings. No prefers-reduced-motion respect. Continuous background animations run unguarded. Bookmark button missing aria-label.

**Jordan (First-Timer)**: Icon-only post management buttons with no tooltip. No visible autosave confirmation in the editor. Share button feedback unclear.

**Alex (Power User)**: No keyboard shortcuts. No command palette. No bulk actions in post list.

## Minor Observations

- text-wrap: balance not consistently applied across hero headings
- .post-content blockquote uses var(--accent-subtle) which is undefined (likely falls back to transparent) — should be var(--accent-soft)
- .read-progress transition is linear; ease-out would feel smoother
- Dashboard section-h h2 labels ("YOUR POSTS") shout more than they need to
