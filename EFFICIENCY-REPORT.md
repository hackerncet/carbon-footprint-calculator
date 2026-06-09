# Efficiency Report — ZeroGrid

## Critical Rendering Path

| Optimization | Implementation | Impact |
|-------------|---------------|--------|
| Font preconnect | `<link rel="preconnect">` for fonts.googleapis.com and fonts.gstatic.com | Eliminates 2 DNS+TLS round trips |
| DNS prefetch | `<link rel="dns-prefetch">` for Firebase origins | Faster auth initialization |
| Font display swap | `display=swap` on Google Fonts | No render-blocking FOIT |
| Code splitting | All 6 pages lazy-loaded via `React.lazy()` | Initial bundle excludes unused pages |
| Vendor chunking | Firebase, Recharts, and other vendors in separate chunks | Parallel downloads + independent caching |
| Compression | Gzip/Brotli via `compression` middleware | ~70% payload reduction |

---

## Bundle Analysis (Production Build)

| Chunk | Raw | Gzipped | Purpose |
|-------|-----|---------|---------|
| `index.css` | 6.98 KB | 2.10 KB | All application styles |
| `index.js` | 11.37 KB | 4.19 KB | React core + routing + contexts |
| `Dashboard.js` | 19.15 KB | 5.34 KB | Largest page (charts + data) |
| `Calculator.js` | 9.53 KB | 3.32 KB | Carbon calculator form |
| `OffsetMarketplace.js` | 11.61 KB | 3.47 KB | Offset purchase flow |
| `Gamification.js` | 6.92 KB | 2.14 KB | Challenges + achievements |
| `Login.js` | 7.28 KB | 2.50 KB | Auth forms |
| `VerifyEmail.js` | 9.28 KB | 2.93 KB | Email verification flow |
| `api.js` | 1.64 KB | 0.65 KB | API service layer |
| `authErrors.js` | 1.36 KB | 0.64 KB | Error formatting utility |
| `vendor-firebase` | 160.63 KB | 32.47 KB | Firebase Auth SDK |
| `vendor-recharts` | 360.55 KB | 89.01 KB | Charting library |
| `vendor` | 360.60 KB | 110.64 KB | React + router + other deps |

**Total app code (excluding vendors): ~85 KB raw, ~27 KB gzipped**

---

## CSS Optimizations

| Optimization | Details |
|-------------|---------|
| Scoped transitions | `transition` moved from `*` to specific selectors (body, cards, buttons, inputs) — eliminates global repaint on every DOM mutation |
| CSS custom properties | Theme switching via CSS variables — zero JS DOM manipulation, single repaint |
| `prefers-reduced-motion` | All animations/transitions disabled for users who prefer reduced motion |
| Single stylesheet | All styles in one `index.css` — no cascade complexity, single HTTP request |

---

## Server-Side Optimizations

| Optimization | Implementation |
|-------------|---------------|
| N+1 query fix | Dashboard aggregation: 12+ per-month queries → 2 bulk queries + in-memory Map |
| O(1) calculation | Calculator uses `Map<string, number>` instead of nested if/else chains |
| WAL mode | SQLite Write-Ahead Logging for concurrent read/write performance |
| Response compression | Gzip compression on all responses via `compression` middleware |
| Static file caching | `maxAge: '1y', immutable: true` for fingerprinted assets; `no-cache` for HTML |
| Connection reuse | Single SQLite connection with Drizzle ORM pooling |

---

## Network Optimizations

| Optimization | Details |
|-------------|---------|
| API timeout | All client API calls use `AbortController` with 10s timeout — prevents hung connections |
| Parallel fetching | Dashboard loads data + footprints via `Promise.all()` — saves 1 round trip |
| JSON body limit | 100 KB max request body — prevents large-payload DoS |
| ETags | Express static middleware generates ETags for conditional requests |

---

## Caching Strategy

| Resource Type | Cache-Control | Rationale |
|--------------|---------------|-----------|
| HTML (`index.html`) | `no-cache, no-store, must-revalidate` | Always serve latest SPA shell |
| JS/CSS (fingerprinted) | `max-age=31536000, immutable` | Content-hash in filename = safe forever-cache |
| API responses | No explicit cache | Dynamic data, always fresh |
| Google Fonts | CDN-managed (Google) | Already globally cached |
