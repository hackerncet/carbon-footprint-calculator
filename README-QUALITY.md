# ZeroGrid Architecture & Code Quality

## Architecture Overview

ZeroGrid is a monorepo with three npm workspaces:

```
carbon-footprint/
├── shared/          # Shared types, constants, Zod validation schemas
├── server/          # Express.js API + SQLite (Drizzle ORM)
└── client/          # React 19 + Vite SPA
```

### Dependency Graph

```
client ──→ shared
server ──→ shared
```

`shared` has zero external dependencies beyond Zod. Both `client` and `server` import from `@carbon/shared`.

---

## Package Details

### `shared/` — Pure Data Layer
| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces for all domain entities (User, FootprintEntry, etc.) |
| `constants.ts` | Frozen emission factors, units map, eco-challenges, simulated offset projects |
| `validation.ts` | Zod schemas for all API request payloads |
| `index.ts` | Barrel re-export |

**Design Principles Applied:**
- All constants frozen with `Object.freeze` (immutability)
- Zod schemas apply `.trim()` to all string inputs (defense-in-depth)
- Strict union types for categories (`'energy' | 'transport' | 'food' | 'waste'`)

### `server/` — Express API
| Directory | Purpose |
|-----------|---------|
| `config/` | Database connection (Drizzle + better-sqlite3), Winston logger |
| `db/` | Drizzle schema definitions |
| `middleware/` | Firebase Auth middleware with dev-mode bypass |
| `routes/` | RESTful API routes (footprint, user, offset, goals, health) |
| `utils/` | Calculator engine, user service, gamification engine |
| `tests/` | Vitest test suites |

**Design Principles Applied:**
- **Single Responsibility**: Each route file handles one resource
- **DRY**: `userService.ts` extracts shared `getOrCreateUser` logic
- **O(1) Lookup**: Calculator uses `Map<string, number>` instead of if/else chains
- **N+1 Prevention**: Dashboard aggregation uses 2 bulk queries + in-memory Map

### `client/` — React SPA
| Directory | Purpose |
|-----------|---------|
| `context/` | AuthContext (Firebase + mock auth), ThemeContext (light/dark) |
| `services/` | API client with typed `fetchWithTimeout<T>()` + AbortController |
| `utils/` | Firebase auth error formatting |
| `components/` | Navbar, GoalsWidget |
| `pages/` | Dashboard, Calculator, Gamification, OffsetMarketplace, Login, VerifyEmail |
| `tests/` | Vitest test suites |

**Design Principles Applied:**
- **Code Splitting**: Every page lazy-loaded via `React.lazy()` + `Suspense`
- **Derived State**: Calculator uses `useMemo` for live preview (no unnecessary re-renders)
- **Generic Fetch**: Single `fetchWithTimeout<T>()` eliminates duplicated error handling
- **Strict Typing**: Zero `any` types across entire codebase

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `Dashboard.tsx` |
| Files (utils/services) | camelCase | `authErrors.ts` |
| Interfaces | PascalCase | `FootprintEntry` |
| Constants | SCREAMING_SNAKE | `EMISSION_FACTORS` |
| Functions | camelCase | `calculateCarbon` |
| CSS classes | kebab-case | `card-glass` |

---

## How to Navigate

1. **Start at `shared/`** — understand the domain types and validation
2. **Read `server/src/app.ts`** — see the middleware stack and route registration
3. **Read `server/src/routes/`** — understand each API endpoint
4. **Read `client/src/main.tsx`** — see the routing and auth gating
5. **Read `client/src/pages/`** — understand each user-facing view
