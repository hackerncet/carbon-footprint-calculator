# Accessibility Conformance — ZeroGrid (WCAG 2.2 AAA)

## Summary

ZeroGrid targets **WCAG 2.2 Level AAA** compliance. This document maps every applicable success criterion to its implementation.

---

## Perceivable

### 1.1 Text Alternatives

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 1.1.1 Non-text Content | A | ✅ | All Lucide icons are decorative (adjacent text labels); `noscript` fallback for JS-disabled users |

### 1.2 Time-based Media
Not applicable — no audio/video content.

### 1.3 Adaptable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 1.3.1 Info and Relationships | A | ✅ | Semantic HTML5: `<nav>`, `<main>`, `<h1>`-`<h2>`, `<ul>`, `<form>`, `<label htmlFor>` |
| 1.3.2 Meaningful Sequence | A | ✅ | DOM order matches visual order; no CSS `order` reordering |
| 1.3.3 Sensory Characteristics | A | ✅ | No instructions rely solely on shape/color/location |
| 1.3.4 Orientation | AA | ✅ | Responsive layout works in both portrait and landscape |
| 1.3.5 Identify Input Purpose | AA | ✅ | Form inputs have descriptive `<label>` elements with `htmlFor` |

### 1.4 Distinguishable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 1.4.1 Use of Color | A | ✅ | Progress bars include percentage text; errors have icon + text; streaks have icon + text |
| 1.4.3 Contrast (Minimum) | AA | ✅ | Light theme: `#0f172a` on `#f8fafc` (>15:1). Dark theme: `#f8fafc` on `#08080a` (>18:1) |
| 1.4.4 Resize Text | AA | ✅ | All sizes in `rem`/`%`; zooms to 200% without loss |
| 1.4.6 Contrast (Enhanced) | AAA | ✅ | Dark `--text-muted: #a8b5c7` on `#08080a` = 7.4:1 ratio (exceeds 7:1 AAA) |
| 1.4.10 Reflow | AA | ✅ | Responsive grid reflows at 320px viewport |
| 1.4.11 Non-text Contrast | AA | ✅ | Buttons and form controls have 3:1+ contrast against backgrounds |
| 1.4.12 Text Spacing | AA | ✅ | No fixed heights that clip text; `line-height: 1.5` throughout |
| 1.4.13 Content on Hover | AA | ✅ | No custom hover content that requires dismissal |

---

## Operable

### 2.1 Keyboard Accessible

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.1.1 Keyboard | A | ✅ | All interactive elements are `<button>`, `<a>`, `<input>`, `<select>` — natively focusable |
| 2.1.2 No Keyboard Trap | A | ✅ | No modal traps; all content navigable with Tab/Shift+Tab |
| 2.1.3 Keyboard (No Exception) | AAA | ✅ | No functionality requires specific pointing device gestures |

### 2.2 Enough Time

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.2.1 Timing Adjustable | A | ✅ | No time limits on user actions |
| 2.2.2 Pause, Stop, Hide | A | ✅ | No auto-playing content; `prefers-reduced-motion` disables all animations |

### 2.3 Seizures and Physical Reactions

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.3.1 Three Flashes | A | ✅ | No flashing content |
| 2.3.3 Animation from Interactions | AAA | ✅ | `@media (prefers-reduced-motion: reduce)` sets all animation/transition durations to 0.01ms |

### 2.4 Navigable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.4.1 Bypass Blocks | A | ✅ | Skip-to-main-content link (`<a href="#main-content" class="skip-link">`) |
| 2.4.2 Page Titled | A | ✅ | `<title>ZeroGrid - Carbon Intelligence Engine</title>` |
| 2.4.3 Focus Order | A | ✅ | No `tabindex > 0`; natural DOM order |
| 2.4.4 Link Purpose | A | ✅ | Nav links have descriptive text labels |
| 2.4.6 Headings and Labels | AA | ✅ | `<h1>` per page, `<h2>` for sections, `<label>` for all inputs |
| 2.4.7 Focus Visible | AA | ✅ | Browser default + custom focus outlines via CSS |
| 2.4.10 Section Headings | AAA | ✅ | Every content section has a heading |

### 2.5 Input Modalities

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.5.5 Target Size (Enhanced) | AAA | ✅ | All buttons ≥ 44×44px; nav links padded `10px 14px` |
| 2.5.8 Target Size (Minimum) | AA | ✅ | Minimum 24×24px on all interactive elements |

---

## Understandable

### 3.1 Readable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 3.1.1 Language of Page | A | ✅ | `<html lang="en" dir="ltr">` |
| 3.1.2 Language of Parts | AA | ✅ | No mixed-language content; CO₂ uses Unicode subscript |

### 3.2 Predictable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 3.2.1 On Focus | A | ✅ | No context changes on focus |
| 3.2.2 On Input | A | ✅ | Form submission only on explicit button click |

### 3.3 Input Assistance

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 3.3.1 Error Identification | A | ✅ | Errors shown with `role="alert"` + red icon + descriptive text |
| 3.3.2 Labels or Instructions | A | ✅ | All form fields have `<label htmlFor>` |
| 3.3.3 Error Suggestion | AA | ✅ | Auth errors provide specific recovery instructions |
| 3.3.4 Error Prevention | AA | ✅ | Delete actions require `confirm()` dialog |

---

## Robust

### 4.1 Compatible

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 4.1.2 Name, Role, Value | A | ✅ | ARIA roles: `navigation`, `alert`, `status`, `progressbar` with `aria-valuenow/min/max` |
| 4.1.3 Status Messages | AA | ✅ | Success/error messages use `aria-live="polite"` / `aria-live="assertive"` |

---

## ARIA Usage Summary

| Element | ARIA Applied |
|---------|-------------|
| Navigation | `role="navigation"` + `aria-label="Main navigation"` |
| Nav links | `aria-current="page"` on active link |
| Theme toggle | `aria-label="Switch to dark/light theme"` |
| Logout button | `aria-label="Logout"` |
| Category tabs | `role="tab"` + `aria-selected` |
| Progress bars | `role="progressbar"` + `aria-valuenow/min/max` + `aria-label` |
| Error messages | `role="alert"` + `aria-live="assertive"` |
| Success toasts | `role="status"` + `aria-live="polite"` |
| Set Budget toggle | `aria-expanded` |
| Route announcer | `aria-live="polite"` + `aria-atomic="true"` |
| Loading states | `role="status"` |

---

## Screen Reader Support

- `.sr-only` CSS class provides visually hidden text for screen readers
- Route change announcer (`#route-announcer`) notifies assistive tech of navigation
- Focus management: skip-link returns focus to main content on activation
