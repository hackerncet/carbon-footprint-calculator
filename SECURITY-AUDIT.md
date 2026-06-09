# Security Audit — ZeroGrid

## OWASP Top 10 (2021) Coverage

| # | Threat | Mitigation | Status |
|---|--------|-----------|--------|
| A01 | Broken Access Control | Firebase Auth middleware (`requireAuth`) verifies JWT on every protected route; dev bypass only in `NODE_ENV !== 'production'` | ✅ |
| A02 | Cryptographic Failures | HSTS enforced (2yr, preload); all cookies marked `secure`, `httpOnly`, `SameSite=Strict` via Firebase SDK | ✅ |
| A03 | Injection | All DB queries use Drizzle ORM parameterised queries; Zod validates all inputs server-side | ✅ |
| A04 | Insecure Design | Rate limiting (100/15min), JSON body limit (100KB), strict CORS origin matching | ✅ |
| A05 | Security Misconfiguration | Helmet with full CSP, HSTS, X-Frame-Options DENY, Permissions-Policy, COOP/CORP, no X-Powered-By | ✅ |
| A06 | Vulnerable Components | Dependencies pinned via lockfile; `express-rate-limit`, `helmet`, `cors` are maintained packages | ✅ |
| A07 | Auth Failures | Firebase Auth with email verification; session auto-timeout via Firebase SDK; brute-force mitigated by rate limiting | ✅ |
| A08 | Software/Data Integrity | Drizzle ORM prevents SQL manipulation; all inputs validated through Zod schemas before processing | ✅ |
| A09 | Logging Failures | Winston structured logger captures method, URL, status, duration, IP for every request | ✅ |
| A10 | SSRF | No user-supplied URLs fetched server-side; `connectSrc` CSP restricts outbound connections | ✅ |

---

## HTTP Security Headers (all set via Helmet + custom middleware)

| Header | Value | File |
|--------|-------|------|
| `Content-Security-Policy` | Strict directives with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` | `app.ts` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `app.ts` |
| `X-Content-Type-Options` | `nosniff` | Helmet default |
| `X-Frame-Options` | `DENY` | `app.ts` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `app.ts` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()...` | `app.ts` |
| `Cross-Origin-Opener-Policy` | `same-origin` | `app.ts` |
| `Cross-Origin-Resource-Policy` | `same-origin` | `app.ts` |
| `X-Powered-By` | Removed | Helmet |
| `X-DNS-Prefetch-Control` | `off` | `app.ts` |

---

## Input Validation

Every API endpoint validates input through Zod schemas before processing:

| Route | Schema | Validated Fields |
|-------|--------|-----------------|
| `POST /api/calculate` | `calculationRequestSchema` | category (enum), subCategory (trimmed string), value (≥0 number) |
| `POST /api/footprint` | `footprintEntrySchema` | entryDate (YYYY-MM-DD regex), category (enum), inputValue (>0), inputUnit, subCategory, notes (≤200 chars) |
| `POST /api/offsets/purchase` | `offsetPurchaseSchema` | projectId (trimmed, non-empty), offsetAmountCo2eKg (>0) |
| `PATCH /api/user/profile` | `profileUpdateSchema` | displayName (≤50 chars, nullable), avatarUrl (URL format, nullable) |
| `POST /api/user/goals` | `userGoalSchema` | category (trimmed), targetValue (>0), targetMonth (YYYY-MM regex) |

---

## XSS Prevention

- **Zero `dangerouslySetInnerHTML`** across entire client codebase
- All user-generated content rendered via React's automatic escaping
- HTML entities in static data replaced with Unicode characters
- Avatar URLs sanitised to require `https://` prefix before CSS rendering
- CSP `script-src` and `style-src` restrict execution sources

---

## CORS Policy

- Strict allow-list with exact origin matching (no wildcards)
- No subdomain fuzzing permitted
- `credentials: true` for authenticated cookie/token flow

---

## Rate Limiting

- Global: 100 requests per 15-minute window per IP on all `/api/` routes
- Uses standard `RateLimit-*` headers (IETF draft-6)
- JSON error response for exceeded limits

---

## Authentication Architecture

1. Firebase Admin SDK verifies JWT tokens server-side
2. Email verification required (`email_verified` claim checked)
3. Dev bypass only active when `NODE_ENV !== 'production'`
4. Token refresh forced after email verification to update claims

---

## Database Security

- All queries use Drizzle ORM (parameterised, no raw SQL concatenation)
- SQLite WAL mode for safe concurrent access
- Database file path from environment variable (no hardcoded paths in production)
