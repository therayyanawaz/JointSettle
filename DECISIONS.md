# DECISIONS.md — Technical Decision Log

This document records every major technical decision made during the development of JointSettle, along with the alternatives considered and the reasoning behind each final choice.

---

## Decision 1: Hash-Based Authentication (No Email / Password / OAuth)

### Problem
Users needed a way to authenticate and access their groups across devices without the complexity and privacy cost of traditional auth systems.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Email + Password** | Familiar UX; standard reset flows | Requires email infrastructure; stores PII; password management liability; GDPR compliance |
| **OAuth (Google, GitHub)** | No password management; high convenience | Requires third-party API keys; privacy concerns; users may not want to link accounts |
| **Magic Link (via email)** | Passwordless; secure | Requires email delivery; delay in login; depends on email provider |
| **Hash-based (chosen)** | No PII stored; works offline for hash generation; minimal infrastructure; simple UX | User must save their hash; no recovery if hash is lost; 62^8 (218 trillion) keyspace is sufficient |

### Final Choice
**Hash-based authentication** — A random 8-character alphanumeric string serves as the sole credential.

### Reasoning
- The app's core value is **privacy-first expense sharing**. Collecting emails or linking social accounts contradicts this.
- No email infrastructure, password hashing, or OAuth callbacks are needed — dramatically reducing the attack surface.
- The 62-character alphabet with 8 positions yields ~218 trillion possible hashes, making brute-force impractical.
- Users can sign up from any device and immediately access their data by re-entering their hash.
- The trade-off (no recovery if lost) is acceptable for a utility app where groups can be recreated.

---

## Decision 2: tRPC for API Layer (vs REST or GraphQL)

### Problem
The frontend needed to communicate with the backend for all CRUD operations on groups, expenses, balances, and user data. The API layer needed to be typesafe across the full stack.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **REST (Next.js API Routes)** | Simple; familiar; good tooling | Duplicate type definitions on client and server; manual response validation; no end-to-end type safety |
| **GraphQL (urql/Apollo)** | Flexible queries; strong typing with codegen | Heavy infrastructure; schema complexity for simple CRUD; learning curve |
| **tRPC (chosen)** | Full end-to-end type safety; minimal boilerplate; auto-completion in frontend; no schema duplication | Tight coupling between client and server; requires monorepo setup; newer ecosystem |

### Final Choice
**tRPC v11** — End-to-end typesafe APIs with React Query integration.

### Reasoning
- tRPC eliminates the need to define API contracts twice (once in the backend, once in the frontend). The TypeScript types flow directly from `src/trpc/routers/` to `src/trpc/client.tsx`.
- Built-in integration with TanStack React Query provides automatic caching, invalidation, and optimistic updates.
- The monorepo structure (single `src/` directory) makes tRPC's tight coupling a benefit rather than a drawback.
- SuperJSON serialization handles `Date`, `Decimal`, and other complex types automatically.

---

## Decision 3: PostgreSQL with Prisma (vs SQLite or MongoDB)

### Problem
The application needed a relational database to store users, groups, expenses, participants, and their complex relationships with referential integrity.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **SQLite** | Zero configuration; file-based; simple deployment | No concurrent write support; limited migration tooling; not suitable for serverless |
| **MongoDB** | Flexible schema; easy to scale horizontally; JSON-like documents | No native joins; weaker referential integrity; complex transaction support |
| **PostgreSQL + Prisma (chosen)** | Full ACID compliance; strong migration tooling; type-safe queries; excellent Vercel/Neon support; 10 models with complex relationships | Requires running a database server; connection pooling needed for serverless |

### Final Choice
**PostgreSQL via Prisma ORM** — Full relational database with Prisma's type-safe query builder.

### Reasoning
- The schema has 10+ models with complex relationships (one-to-many, many-to-many join tables, composite keys, cascading deletes). A relational database is the natural fit.
- Prisma provides auto-generated TypeScript types for all queries, eliminating the need for manual type definitions.
- Prisma Migrations provide version-controlled schema evolution with rollback support.
- PostgreSQL is well-supported on Vercel via Neon, Supabase, and other serverless PostgreSQL providers.
- The `onDelete: Cascade` pattern on all foreign keys ensures data integrity when groups or expenses are deleted.

---

## Decision 4: Minor Units for Monetary Amounts (vs Decimal/float)

### Problem
Expense amounts needed to be stored, calculated, and displayed accurately across four split modes with precise rounding.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Float (JavaScript Number)** | Simple; native type | Floating-point rounding errors; unreliable for financial calculations |
| **Decimal.js / big.js** | Arbitrary precision; accurate rounding | Additional dependency; more verbose syntax |
| **Integers in minor units (chosen)** | Zero rounding errors; integer arithmetic is fast; simple comparison | Requires conversion functions; limited to currency precision (e.g., 2 decimal places) |

### Final Choice
**Store all monetary amounts as integers in minor units** (cents). For example, $25.50 is stored as `2550`.

### Reasoning
- Financial calculations must be exact. Floating-point errors in JavaScript (e.g., `0.1 + 0.2 !== 0.3`) are unacceptable for expense splitting.
- Integer arithmetic is the safest and most performant approach.
- The `decimal.js` library is used only in Zod validation (`src/lib/schemas.ts`) to verify that BY_AMOUNT shares sum to the total — one specific case where decimal addition is needed.
- Helper functions in `src/lib/utils.ts` handle conversion between display (decimal) and storage (minor units) formats.

---

## Decision 5: Balance Calculation with Greedy Reimbursement Algorithm

### Problem
After processing expenses, the system needed to compute each participant's net balance and suggest the minimal set of payments to settle all debts.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Minimal transactions (maximum bipartite matching)** | Produces absolute minimum number of transactions | Complex algorithm (O(n³)); overkill for typical group sizes (2-20 people) |
| **Greedy pairing (chosen)** | Simple O(n log n) sort + O(n) settlement; handles any group size | May not produce absolute minimum number of transactions in edge cases |
| **Settle individually per expense** | Intuitive; easy to trace | Produces many unnecessary micro-payments |

### Final Choice
**Greedy algorithm** — Sort participants by total balance, then repeatedly pair the largest creditor with the largest debtor.

### Reasoning
- For groups of typical size (2-20 people), the greedy algorithm produces the same result as the optimal algorithm in the vast majority of cases.
- The algorithm is simple to implement, reason about, and debug.
- A stable comparator (`compareBalancesForReimbursements`) ensures that executing a suggested reimbursement doesn't produce completely new suggestions, preventing feedback loops.
- The `getPublicBalances` function adjusts displayed balances after reimbursements are "applied" so users see their net position.

---

## Decision 6: Four Split Modes with Last-Participant Rounding

### Problem
Expenses needed to be divided among participants in different ways, with the constraint that the sum of all shares must equal the total amount exactly (no rounding discrepancies).

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Floating-point division** | Simple | Rounding errors accumulate; totals may not balance |
| **Store as rational (numerator/denominator)** | Exact | Complex display logic; storage overhead |
| **Last-participant-gets-remainder (chosen)** | Exact balancing; simple implementation; intuitive | Last participant may get slightly different amount |

### Final Choice
For each expense, distribute shares using the **last-participant-gets-remainder** strategy. The last participant in the paidFor list receives whatever remains after all others have been allocated.

### Reasoning
- This guarantees that `sum(shares) === total` with zero rounding error.
- The "last participant" effect is minimal (at most 1 minor unit, typically $0.01) and affects all participants equally over many expenses.
- Implementation in `src/lib/balances.ts`:

```
const dividedAmount = isLast
  ? remaining                    // Last participant gets the remainder
  : (expense.amount * shares) / totalShares
remaining -= dividedAmount
```

---

## Decision 7: Prisma db push vs migrate deploy on Vercel

### Problem
The database schema needed to stay in sync with the Prisma schema during Vercel deployments, but the project went through several iterations of migration strategies.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **prisma migrate deploy** | Production-safe; version-controlled; can roll back | Requires migration files to be generated and committed; failed in early deployment attempts |
| **prisma db push (chosen)** | Simple; always syncs to current schema; no migration files needed | Not reversible; no version history; can drop data in development |
| **Manual SQL migrations** | Full control | Error-prone; no integration with Prisma |

### Final Choice
**`prisma db push`** in the Vercel build command.

### Reasoning
- The project is in active development with frequent schema changes. `db push` ensures the production database always matches the current schema without maintaining migration files.
- For production safety, this is acceptable because:
  - The database is a managed PostgreSQL instance (Neon) with point-in-time recovery.
  - Schema changes are additive or backward-compatible.
  - The seed script (`prisma/seed.ts`) is idempotent (uses `upsert` for categories).

---

## Decision 8: next-intl for Internationalization

### Problem
The application needed to support 23+ languages with a simple, Next.js-native approach.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **react-i18next** | Most popular; rich ecosystem | Requires manual Next.js integration; SSR complexity |
| **next-intl (chosen)** | Built for Next.js App Router; supports SSR, client, and server components; simple API | Smaller ecosystem; less community tooling |
| **Custom i18n solution** | Full control | High maintenance; reinventing the wheel |

### Final Choice
**next-intl** — Internationalization library built specifically for Next.js.

### Reasoning
- Native support for Next.js App Router Server Components and Client Components.
- Translation files are simple JSON files in `messages/`, making it easy for community contributors to add new languages.
- Locale detection via `Negotiator` (browser Accept-Language header) works seamlessly.
- TypeScript support for translation keys via `useTranslations` hooks.

---

## Decision 9: Zod for Form and API Validation

### Problem
Input data from forms and API calls needed to be validated before processing.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Yup** | Popular; chainable API | Less TypeScript-inferred types; larger bundle |
| **Zod (chosen)** | Deep TypeScript integration; small bundle; excellent error messages | Newer library (less community adoption) |
| **JSON Schema** | Language-agnostic | Verbose; no TypeScript integration; poor DX |
| **Manual validation** | No dependencies | Error-prone; high maintenance; inconsistent |

### Final Choice
**Zod** — Schema declaration and validation with automatic TypeScript type inference.

### Reasoning
- Zod schemas define validation once and automatically infer TypeScript types via `z.infer<typeof schema>`.
- Complex validation rules (e.g., percentage sum must equal 100%, BY_AMOUNT shares must equal total) are handled via `superRefine`.
- Coercion and transformation (e.g., string-to-number conversion for form inputs) are built-in.
- Zod's discriminated unions handle the different validation rules for each split mode cleanly.

---

## Decision 10: Papaparse for CSV Import

### Problem
The CSV import feature needed a robust parser that could handle the app's export format and flexible column naming.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Manual string splitting** | No dependencies | Fragile; breaks with quoted fields, commas in data, BOM characters |
| **csv-parse** (Node.js) | Streaming; memory efficient | Larger library; more API surface than needed |
| **Papaparse (chosen)** | Browser + Node support; auto-detects delimiters; handles edge cases well | Slightly larger bundle (but used only server-side in tRPC) |

### Final Choice
**Papaparse** — Robust CSV parser with header normalization and configurable output.

### Reasoning
- Papaparse handles edge cases automatically: quoted fields, escaped commas, BOM characters, inconsistent line endings.
- The `transformHeader` callback allows flexible column name normalization (e.g., matching "Description" or "Title" to the `title` field).
- Works in the server-side tRPC context without additional configuration.
- Well-maintained and widely used (2M+ weekly downloads).

---

## Decision 11: Dual-Mode CSV Import Architecture

### Problem
The CSV import needed to support both the app's existing export format AND the assignment CSV format (with columns: `date`, `description`, `paid_by`, `amount`, `currency`, `split_type`, `split_with`, `split_details`, `notes`).

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Single unified parser** | One code path; simpler maintenance | Column conflicts; awkward conditional logic; data assumptions may not hold for both formats |
| **User selects format** | Clear user intent | Poor UX; users may not know which format they have |
| **Auto-detect dual-mode (chosen)** | Seamless UX; each parser is clean and format-specific | Two code paths to maintain; detection logic could misidentify ambiguous files |

### Final Choice
**Auto-detect dual-mode** — The import procedure inspects CSV headers at runtime and dispatches to the correct format-specific parser.

### Reasoning
- Each parser is purpose-built for its format, avoiding messy conditionals.
- Detection is reliable: assignment CSV has distinct columns (`paid_by`, `split_with`, `split_details`) not present in app exports, and vice versa.
- Detection falls back to assignment CSV format as default since that's the primary import target.
- Shared utilities (date parsing, amount parsing, participant matching, anomaly generation) live in `src/lib/csv-parser.ts` to avoid duplication.

---

## Decision 12: Structured Anomaly Classification System

### Problem
The import needed to detect, classify, and report data quality issues with enough detail for users to understand and fix problems.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Binary pass/fail** | Simple | No actionable feedback; users can't tell what went wrong |
| **Error messages only** | Informative | Unstructured; hard to build UIs on top of; can't filter by severity |
| **Structured Anomaly type with severity + action (chosen)** | Rich reporting; filterable; actionable; enables auto-fix logging | More complex return types; requires JSON serialization for persistence |

### Final Choice
**Structured `Anomaly` type** with three severities (`error`, `warning`, `info`) and three actions (`skipped`, `auto-fixed`, `flagged`).

### Reasoning
- Structured data enables the rich import report UI with categorized sections (errors, warnings, auto-fixes).
- Severity levels let users prioritize: errors block imports, warnings need review, info is informational.
- The action field enables audit logging — every auto-fix is documented with original and new values.
- Anomalies are serialized to the `ImportLog.data` field as JSON for persistence and downloadable reports.

---

## Decision 13: Date Format Ambiguity Handling via User Prompt

### Problem
Dates like `04/05/2026` are ambiguous — they could be April 5 (DD/MM) or May 4 (MM/DD). The parser needed to handle this without guessing.

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Always DD/MM** | Simple; consistent | Wrong for half the CSV files; produces silently incorrect data |
| **Heuristic (first >12 = day)** | Works for most cases | Fails when both parts ≤ 12; still ambiguous |
| **User prompt (chosen)** | User knows their own format; no incorrect parses | Requires UI interaction; pauses the import flow |

### Final Choice
**Two-phase import**: Phase 1 detects ambiguous dates and returns them to the UI; Phase 2 re-imports with the user's chosen format.

### Reasoning
- The tRPC procedure returns `{ ambiguousDates, requiresDateFormat: true }` when ambiguity is detected.
- The import dialog shows a date format picker (DD/MM vs MM/DD) with an example conversion for each choice.
- The user's choice is sent back as the `preferredDateFormat` parameter in the next import attempt.
- This approach ensures zero incorrect date parses while maintaining a smooth UX flow.

---

## Decision 14: Time-Based Membership via joinedAt/leftAt

### Problem
The assignment CSV scenario requires that participants are only responsible for expenses that occurred during their membership period. Meera moves out March 28 (shouldn't be charged after), Sam joins April 8 (shouldn't be charged before).

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Manual participation flags per expense** | Granular control | Tedious for large groups; defeats the purpose of time-based membership |
| **Date ranges on participants (joinedAt/leftAt) + automatic filtering (chosen)** | Automatic; once dates are set, expenses are handled correctly | Requires schema migration; adds complexity to balance calculations |
| **Separate membership table** | More normalized | Over-engineering for the use case; complicates queries |

### Final Choice
**Add `joinedAt` and `leftAt` columns to Participant** — Both are `DateTime` fields; `leftAt` is nullable (null = currently active).

### Reasoning
- Simple schema change: two fields on the existing `Participant` model.
- `joinedAt` defaults to `now()` for backward compatibility with existing participants.
- The import procedure checks membership dates: if a participant's `joinedAt > expenseDate` or `leftAt < expenseDate`, they are considered inactive and skipped with a `MEMBER_NOT_ACTIVE` anomaly.
- Soft-deletes: when a participant leaves via the Leave Group button or group edit, `leftAt` is set to `now()` instead of deleting the record.
- The participant timeline component (`ParticipantTimeline`) provides visual feedback of membership periods.
