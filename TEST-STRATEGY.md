# Test Strategy — ZeroGrid

## Test Pyramid

```
        ┌──────────────┐
        │   E2E Tests   │  ← Manual / future Playwright
        ├──────────────┤
        │ Integration   │  ← API route tests (Supertest)
        ├──────────────┤
        │  Unit Tests   │  ← Calculator, validation, auth errors, constants
        └──────────────┘
```

---

## Test Suite Inventory

### Server Tests (55 tests)

| Suite | File | Tests | Type | Coverage |
|-------|------|-------|------|----------|
| Calculator Engine | `server/src/tests/calculator.test.ts` | 24 | Unit | All 15 subcategories, edge cases (0, negative, NaN, Infinity), invalid categories, UNITS_MAP consistency |
| Zod Validation | `server/src/tests/validation.test.ts` | 25 | Unit | All 5 schemas: valid/invalid data, missing fields, boundary values, trimming |
| API Endpoints | `server/src/tests/api.test.ts` | 6 | Integration | Express routes + middleware + SQLite: health, calculate, footprint CRUD, dashboard, offsets |

### Client Tests (24 tests)

| Suite | File | Tests | Type | Coverage |
|-------|------|-------|------|----------|
| Emission Constants | `client/src/tests/calculations.test.ts` | 7 | Unit | All emission factors, UNITS_MAP, Object.freeze verification |
| Auth Error Formatting | `client/src/tests/authErrors.test.ts` | 17 | Unit | All Firebase auth codes, edge cases (null, undefined, string, Error), message stripping |

**Total: 79 tests, 100% passing**

---

## Test Design Principles

### AAA Pattern (Arrange-Act-Assert)
Every test follows the standard structure:
```typescript
it('calculates electricity emissions correctly', () => {
  // Arrange: inputs are implicit in the function call
  // Act
  const result = calculateCarbon('energy', 'electricity', 100);
  // Assert
  expect(result.carbonCo2eKg).toBe(38);
  expect(result.unit).toBe('kWh');
});
```

### Edge Case Coverage
- **Zero values**: Verify calculation returns 0
- **Negative values**: Verify throws with descriptive error
- **NaN / Infinity**: Verify throws `non-negative finite`
- **Invalid categories**: Verify throws `Invalid category`
- **Empty strings**: Verify Zod rejects
- **Boundary lengths**: Verify 200-char note limit, 50-char display name
- **Null/undefined**: Verify auth error formatter handles gracefully

### Hermetic Tests
- API tests use a separate in-memory SQLite database
- No external service dependencies
- No flaky timers or network calls
- Tests are fully idempotent

---

## Running Tests

```bash
# All tests
npm test

# Server only
npm run test:server

# Client only
npm run test:client
```

---

## Coverage Strategy

| Layer | What's Covered |
|-------|---------------|
| **Shared constants** | Every emission factor value, every UNITS_MAP entry, Object.freeze immutability |
| **Zod schemas** | Valid data, invalid data, missing fields, trimming, regex patterns, boundary values |
| **Calculator** | All 15 subcategories × valid + edge cases = 24 test cases |
| **Auth errors** | All 10 Firebase error codes + 7 edge case inputs = 17 test cases |
| **API routes** | Health check, public calculate, authenticated footprint CRUD, dashboard aggregation, offset purchase validation |

---

## Confidence Assessment

- **Unit tests** guarantee correctness of all pure functions and data transformations
- **Integration tests** verify the full Express middleware stack (auth, validation, DB, response)
- **Type safety** provides compile-time guarantees (zero `any` types across entire codebase)
- **Zod validation** provides runtime input guarantees on every API endpoint
