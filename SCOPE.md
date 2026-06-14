# SCOPE.md — JointSettle Project Analysis

## 1. CSV Import Architecture

### 1.1 Overview

The JointSettle application includes a **CSV import feature** (`src/trpc/routers/groups/expenses/importCsv.procedure.ts`) that allows users to upload expense data from CSV files. The import was rewritten to support a **dual-mode architecture**: it can process both the app's own export format AND the assignment CSV format used in the project specification.

**Core architecture:**

```
CSV Upload → PapaParse → Format Detection → Assignment CSV Parser / App Export Parser → Anomaly Detection → ImportResult + ImportLog (persisted)
```

**Format detection** (`src/lib/csv-parser.ts`):
- Checks for telltale columns (`paid_by`, `split_with`, `split_details`) to identify the assignment CSV format
- Checks for app-export columns (`split mode`, `is reimbursement`, `original cost`) to identify the app's native export
- Falls back to assignment CSV format as the default

**Shared utilities** in `src/lib/csv-parser.ts`:
- `detectCsvFormat(rawHeaders)` — Auto-detects which CSV format is being used
- `parseDate(dateStr, preferredFormat?)` — Handles ISO 8601, DD/MM/YYYY, MM/DD/YYYY, text month formats with ambiguity detection and user-prompt flow
- `parseAmount(amountStr)` — Strips commas, whitespace, returns parsed value + flag for comma anomalies
- `hasExcessivePrecision(amount)` — Detects 3+ decimal places
- `parseSplitDetails(splitType, details, participants)` — Parses semicolon-delimited splits for unequal (amount), percentage, and share modes
- `findParticipant(name, participants)` — Case-insensitive name matching with fuzzy fallback
- `createAnomaly(id, row, field, type, severity, action, desc)` — Structured anomaly generation with auto-incrementing IDs

### 1.2 Assignment CSV Column Mapping

| Source Column | Target | Parsing Logic |
|---|---|---|
| `date` | `expenseDate` | Auto-detect format: ISO → DD/MM/YYYY → MM/DD/YYYY → text month. Ambiguous dates flagged for user resolution |
| `description` | `title` | Trimmed, min 2 chars validated |
| `paid_by` | `paidById` | Case-insensitive match to existing participants |
| `amount` | `amount` | Comma-stripped, converted to minor units (×100), validated non-zero |
| `currency` | `originalCurrency` | Compared to group currency; if different, stored as original currency |
| `split_type` | `splitMode` | Mapped: equal→EVENLY, unequal→BY_AMOUNT, percentage→BY_PERCENTAGE, share→BY_SHARES |
| `split_with` | `paidFor[]` entries | Semicolon-delimited, matched case-insensitively to participants |
| `split_details` | `paidFor[].shares` | Parsed per split_type: amounts/percentages/shares with name-value pairs |
| `notes` | `notes` | Stored as-is; scanned for settlement/duplicate signals |

### 1.3 Data Assumptions

The CSV import logic makes the following assumptions about input data:

1. **CSV has a header row** — Both formats use `Papa.parse` with `header: true`.
2. **Assignment CSV uses specific column names** — `date`, `description`, `paid_by`, `amount`, `currency`, `split_type`, `split_with`, `split_details`, `notes`.
3. **App export uses flexible column names** — Aliases like `Title`/`Description`, `Cost`/`Amount`, etc. are normalized.
4. **Amounts are in decimal form** — CSV amounts are in standard decimal notation (e.g., `25.50`), converted to minor units (cents).
5. **Participants must pre-exist** — Unknown participant names in the CSV are rejected with an anomaly; the importer does not create new participants.
6. **Dates are in one of the supported formats** — ISO, DD/MM/YYYY, MM/DD/YYYY, or text month (e.g., "Mar 14, 2026").
7. **UTF-8 BOM is handled** — PapaParse handles this transparently.
8. **Split_details uses semicolon delimiters** — Multiple participants are separated by `;` with name-value pairs (e.g., "Rohan 700; Priya 400").

---

## 2. Database Schema Documentation

### 2.1 Entity Relationship Diagram (Textual)

```
User (1) ─────< (N) Group
Group (1) ────< (N) Participant
Group (1) ────< (N) Expense
Group (1) ────< (N) Activity
Category (1) ──< (N) Expense
Participant (1) ─< (N) Expense     [as paidBy]
Participant (1) ─< (N) ExpensePaidFor
Expense (1) ────< (N) ExpensePaidFor
Expense (1) ────< (N) ExpenseDocument
Expense (1) ──── (0..1) RecurringExpenseLink
Expense (1) ──── (0..1) RecurringExpenseLink [as currentFrameExpense]
Group (1) ─────< (N) ImportLog
```

### 2.2 Models

#### User
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `hash` | `String` | `@unique` | 8-char alphanumeric access key |
| `createdAt` | `DateTime` | `@default(now())` | Account creation timestamp |
| `groups` | `Group[]` | Relation | Groups owned by this user |

**Relationships:**
- One-to-many with `Group` via `userId`

---

#### Group
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `name` | `String` | Required | Group display name |
| `information` | `String?` | `@db.Text` | Optional group description |
| `currency` | `String` | `@default("$")` | Currency symbol |
| `currencyCode` | `String?` | Nullable | ISO-4217 currency code (e.g., "USD") |
| `userId` | `String` | Required | Foreign key to User |
| `createdAt` | `DateTime` | `@default(now())` | Group creation timestamp |

**Indexes:**
- `@@index([userId])` — Optimized user group lookup

**Relationships:**
- Many-to-one with `User` via `userId` (Cascade delete)
- One-to-many with `Participant` via `groupId` (Cascade delete)
- One-to-many with `Expense` via `groupId` (Cascade delete)
- One-to-many with `Activity` via `groupId` (Cascade delete)
- One-to-many with `ImportLog` via `groupId` (Cascade delete)

---

#### Participant
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `name` | `String` | Required | Display name |
| `groupId` | `String` | Required | Foreign key to Group |
| `joinedAt` | `DateTime` | `@default(now())` | When this member joined the group |
| `leftAt` | `DateTime?` | Nullable | When this member left the group (null = active) |

**Relationships:**
- Many-to-one with `Group` via `groupId` (Cascade delete)
- One-to-many with `Expense` via `paidById` (as "expensesPaidBy")
- One-to-many with `ExpensePaidFor` via `participantId` (as "expensesPaidFor")

---

#### Category
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Numeric ID |
| `grouping` | `String` | Required | Category group (e.g., "Housing") |
| `name` | `String` | Required | Category name (e.g., "Rent") |

**Seeded Data:** 101 categories across 12 groupings (General, Payment, Housing, Transportation, Food & Dining, Shopping, Entertainment, Travel, Healthcare, Education, Income, Donation).

**Relationships:**
- One-to-many with `Expense` via `categoryId`

---

#### Expense
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `groupId` | `String` | Required | Foreign key to Group |
| `expenseDate` | `DateTime` | `@db.Date` | Date of expense |
| `title` | `String` | Required | Description |
| `categoryId` | `Int` | `@default(0)` | Foreign key to Category |
| `amount` | `Int` | Required | Monetary amount in minor units (cents) |
| `originalAmount` | `Int?` | Nullable | Original amount in foreign currency (cents) |
| `originalCurrency` | `String?` | Nullable | ISO-4217 code of original currency |
| `conversionRate` | `Decimal?` | Nullable | Exchange rate used |
| `paidById` | `String` | Required | Foreign key to Participant (who paid) |
| `isReimbursement` | `Boolean` | `@default(false)` | Whether this is a settlement payment |
| `splitMode` | `SplitMode` | `@default(EVENLY)` | Enum: EVENLY, BY_SHARES, BY_PERCENTAGE, BY_AMOUNT |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `notes` | `String?` | Nullable | Optional notes |
| `recurrenceRule` | `RecurrenceRule?` | `@default(NONE)` | DAILY, WEEKLY, MONTHLY, or NONE |
| `recurringExpenseLinkId` | `String?` | Nullable | Foreign key to RecurringExpenseLink |

**Relationships:**
- Many-to-one with `Group` via `groupId` (Cascade delete)
- Many-to-one with `Category` via `categoryId`
- Many-to-one with `Participant` via `paidById` (Cascade delete)
- One-to-many with `ExpensePaidFor` via `expenseId` (Cascade delete)
- One-to-many with `ExpenseDocument` via `expenseId`
- One-to-one with `RecurringExpenseLink` via `recurringExpenseLinkId`

---

#### ImportLog
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `groupId` | `String` | Required | Foreign key to Group |
| `fileName` | `String` | Required | Original uploaded filename |
| `totalRows` | `Int` | Required | Total rows in the CSV |
| `imported` | `Int` | Required | Successfully imported rows |
| `skipped` | `Int` | Required | Rows skipped due to errors |
| `autoFixed` | `Int` | Required | Rows with auto-fixed anomalies |
| `warnings` | `Int` | Required | Rows with warnings |
| `errors` | `Int` | Required | Rows with errors |
| `anomalyCount` | `Int` | `@default(0)` | Total anomalies detected |
| `data` | `String?` | `@db.Text` | JSON-serialized full anomaly details + format info |
| `createdAt` | `DateTime` | `@default(now())` | Import timestamp |

**Indexes:**
- `@@index([groupId])` — Optimized per-group import log lookup

**Relationships:**
- Many-to-one with `Group` via `groupId` (Cascade delete)

---

#### ExpensePaidFor (Join Table)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `expenseId` | `String` | Composite PK | Foreign key to Expense |
| `participantId` | `String` | Composite PK | Foreign key to Participant |
| `shares` | `Int` | `@default(1)` | Split value based on mode |

**Composite Primary Key:** `@@id([expenseId, participantId])`

**Relationships:**
- Many-to-one with `Expense` via `expenseId` (Cascade delete)
- Many-to-one with `Participant` via `participantId` (Cascade delete)

---

#### ExpenseDocument
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `url` | `String` | Required | S3 or external URL |
| `width` | `Int` | Required | Image width in pixels |
| `height` | `Int` | Required | Image height in pixels |
| `expenseId` | `String?` | Nullable | Foreign key to Expense |

**Relationships:**
- Many-to-one with `Expense` via `expenseId`

---

#### Activity
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `groupId` | `String` | Required | Foreign key to Group |
| `time` | `DateTime` | `@default(now())` | Action timestamp |
| `activityType` | `ActivityType` | Required | Enum: UPDATE_GROUP, CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE |
| `participantId` | `String?` | Nullable | Who performed the action |
| `expenseId` | `String?` | Nullable | Which expense was affected |
| `data` | `String?` | Nullable | Additional context (e.g., expense title) |

**Relationships:**
- Many-to-one with `Group` via `groupId` (Cascade delete)

---

#### RecurringExpenseLink
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id` | Auto-generated nanoid |
| `groupId` | `String` | Required | Group identifier |
| `currentFrameExpenseId` | `String` | `@unique` | Foreign key to the source Expense |
| `nextExpenseCreatedAt` | `DateTime?` | Nullable | When the next instance was created |
| `nextExpenseDate` | `DateTime` | Required | Scheduled date for next instance |

**Indexes:**
- `@@index([groupId])`
- `@@index([groupId, nextExpenseCreatedAt, nextExpenseDate(sort: Desc)])`

---

### 2.3 Enumerations

| Enum | Values | Description |
|---|---|---|
| `SplitMode` | `EVENLY`, `BY_SHARES`, `BY_PERCENTAGE`, `BY_AMOUNT` | Expense distribution method |
| `RecurrenceRule` | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY` | Recurrence frequency |
| `ActivityType` | `UPDATE_GROUP`, `CREATE_EXPENSE`, `UPDATE_EXPENSE`, `DELETE_EXPENSE` | Activity log categories |

---

## 3. Key Architectural Decisions

### 3.1 Monetary Amount Storage

All monetary amounts are stored as **integers in minor units** (cents). For example, $25.50 is stored as `2550`. This avoids floating-point rounding errors in financial calculations.

**Conversion functions** are located in `src/lib/utils.ts`:
- `amountAsMinorUnits(value, currency)` — Converts decimal to minor units
- `amountAsDecimal(value, currency)` — Converts minor units back to decimal
- `formatCurrency(currency, amount, locale)` — Formats for display

### 3.2 Balance Calculation Engine

The balance engine (`src/lib/balances.ts`) processes expenses to produce per-participant totals:
- `paid` — Total amount this person has paid
- `paidFor` — Total amount this person owes (their share of all expenses)
- `total = paid - paidFor` — Net balance (positive = owed money, negative = owes money)

The reimbursement algorithm greedily pairs the largest creditor with the largest debtor, producing a minimal set of suggested transfers.

### 3.3 Rounding Strategy

Rounding is handled at the per-participant level using a **last-participant-gets-remainder** strategy. For each expense, the last participant in the split receives whatever remains after distributing to all others, ensuring the total always balances to zero.

### 3.4 Audit Trail

All expense mutations (create, update, delete) and group changes are recorded in the `Activity` table. This provides a full audit trail visible in the Activity tab of each group, showing who performed which action and when.

---

## 4. Assignment Requirements Check

| Requirement | Status | Notes |
|---|---|---|
| Login module | ✅ Complete | Hash-based auth with signup/login pages |
| Group management with changing membership | ✅ Complete | Join/leave flow + edit group participants |
| Expenses with all split types | ✅ Complete | 4 split modes supported |
| Group balances and individual summaries | ✅ Complete | Balances page with per-person breakdowns |
| Settle debts / record payments | ✅ Complete | Reimbursements tab with "Mark as Paid" |
| Import expenses CSV | ✅ Complete | tRPC procedure + UI dialog implemented |
| Relational DB only | ✅ Complete | PostgreSQL via Prisma |
| CSV file analysis (anomalies) | ⚠️ Documented | Import logic exists; no actual CSV files to analyze in repo |
### 3.3 Rounding Strategy

Rounding is handled at the per-participant level using a **last-participant-gets-remainder** strategy. For each expense, the last participant in the split receives whatever remains after distributing to all others, ensuring the total always balances to zero.

### 3.4 Audit Trail

All expense mutations (create, update, delete) and group changes are recorded in the `Activity` table. This provides a full audit trail visible in the Activity tab of each group, showing who performed which action and when.

### 3.5 Balance Transparency

The balances page features click-to-expand drill-down cards that show each participant's expense-level breakdown (which expenses contribute to their balance, sorted by date). The information tab shows a visual timeline of member join/leave dates.

### 3.6 Import Reports

Each CSV import generates a persistent `ImportLog` record with full anomaly data. Users can view the report at `/groups/[groupId]/imports/[importId]` or download it as JSON for programmatic analysis.

---

## 4. Assignment Requirements Check

| Requirement | Status | Notes |
|---|---|---|
| Login module | ✅ Complete | Hash-based auth with signup/login pages |
| Group management with changing membership | ✅ Complete | Join/leave flow + edit group participants, time-based membership with joinedAt/leftAt |
| Expenses with all split types | ✅ Complete | 4 split modes supported |
| Group balances and individual summaries | ✅ Complete | Balances page with per-person breakdowns and drill-down |
| Settle debts / record payments | ✅ Complete | Reimbursements tab with "Mark as Paid" |
| Import expenses CSV | ✅ Complete | Dual-mode import: app-export + assignment CSV format with 18 anomaly detectors |
| Relational DB only | ✅ Complete | PostgreSQL via Prisma |
| CSV file analysis (anomalies) | ✅ Complete | 18 anomaly types detected with severity classification (error/warning/info) and actions (skipped/auto-fixed/flagged) |
| Import report with downloadable results | ✅ Complete | Persistent import logs with in-app report page + JSON download endpoint |
| Balance transparency | ✅ Complete | Click-to-expand drill-down on balance cards showing per-expense contribution |
| Member timeline | ✅ Complete | Visual timeline in Information tab showing join/leave dates |

## 5. Complete Anomaly Detection Roster (18 Types)

| # | Anomaly Type | Severity | Action | Detection Logic |
|---|---|---|---|---|
| 1 | **DUPLICATE_EXPENSE** | warning | flagged | Same date + same amount + fuzzy title match (80%+) |
| 2 | **DATE_FORMAT_INCONSISTENT** | info | auto-fixed | Mix of ISO, DD/MM/YYYY, text dates detected |
| 3 | **DATE_AMBIGUOUS** | error | flagged | `04/05/2026` — both parts ≤ 12, requires user format preference |
| 4 | **DATE_MISSING** | error | skipped | Empty date field in row |
| 5 | **DATE_UNPARSEABLE** | error | skipped | `new Date()` returns `NaN` after all parsing attempts |
| 6 | **TITLE_MISSING** | error | skipped | Description field empty or < 2 characters |
| 7 | **AMOUNT_MISSING** | error | skipped | Empty amount field |
| 8 | **AMOUNT_INVALID** | error | skipped | `parseFloat()` returns `NaN` |
| 9 | **AMOUNT_COMMAS** | info | auto-fixed | `"1,200"` — commas in numeric value, stripped before parsing |
| 10 | **AMOUNT_EXTRA_PRECISION** | info | auto-fixed | `899.995` — 3+ decimal places, rounded to 2dp |
| 11 | **AMOUNT_NEGATIVE** | warning | auto-fixed | `-30` — negative amount, treated as potential refund |
| 12 | **AMOUNT_ZERO** | error | skipped | Amount is 0 — no valid expense |
| 13 | **CURRENCY_MISSING** | info | auto-fixed | Empty currency field, defaults to group currency |
| 14 | **PAID_BY_MISSING** | error | skipped | Empty `paid_by` field |
| 15 | **PAID_BY_UNKNOWN** | error | skipped | `paid_by` doesn't match any group participant |
| 16 | **SPLIT_TYPE_MISSING** | warning | auto-fixed | Empty `split_type`, defaults to EVENLY |
| 17 | **SPLIT_TYPE_UNKNOWN** | warning | auto-fixed | Unrecognized split type value, defaults to EVENLY |
| 18 | **PARTICIPANT_UNKNOWN** | warning | skipped | Name in `split_with`/`split_details` doesn't match any participant |
| 19 | **PARTICIPANT_NAME_CASE** | info | auto-fixed | Casing mismatch (e.g., `priya` vs `Priya`) |
| 20 | **PARTICIPANT_NAME_SIMILAR** | warning | flagged | Close but not exact match (e.g., `Priya S` vs `Priya`) |
| 21 | **SETTLEMENT_IN_NOTES** | warning | auto-fixed | Notes contain "settlement", "paid back", "reimbursement" signals |
| 22 | **MEMBER_NOT_ACTIVE** | error | skipped | Participant referenced but `joinedAt`/`leftAt` shows inactivity on the expense date |
| 23 | **PAID_BY_NOT_ACTIVE** | error | skipped | Payer was not a group member on the expense date |
| 24 | **NO_VALID_SPLIT_PARTICIPANTS** | error | skipped | No valid split participants after filtering unknowns/inactive |

**Note:** The actual implementation detects several additional sub-types beyond the 18 target minimum, bringing the total to 24 anomaly detection scenarios. Each anomaly carries structured metadata (`row`, `field`, `type`, `severity`, `action`, `description`, `fix?`, `originalValue?`) for detailed reporting.