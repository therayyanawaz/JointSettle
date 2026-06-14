# AI_USAGE.md — AI Tools & Development Assistance

## 1. AI Tools Used

| Tool | Purpose | Context |
|---|---|---|
| **Fable5** | Initial planning and architecture design | Structured brainstorming and decision validation |
| **Opus 4.8** | Primary coding assistant; implemented features, refactored code, fixed bugs, wrote documentation | Advanced code generation and reasoning model |
| **GPT-3.5 Turbo** | In-app AI features (category extraction from expense titles) | Used via OpenAI API within the app itself |
| **GPT-4o** | In-app AI features (receipt scanning via vision API) | Used via OpenAI API within the app itself |

**Note:** The AI tools listed above were used in two distinct contexts:
1. **Development assistance** — AI helped write the code (Opus 4.8 / Fable5 / DeepSeek V4 Flash)
2. **In-app features** — The application itself offers AI-powered features to end users (OpenAI)

---

## 2. How AI Assisted Development

### 2.1 Feature Implementation

AI generated complete implementations for several features:

- **Category system realignment** — AI analyzed the mismatch between database categories and translation file keys, then rewrote `prisma/seed.ts` to create 101 categories across 12 groupings matching the i18n structure. It also updated `category-icon.tsx` with appropriate Lucide icons for every category.
- **Hash-based authentication** — AI generated the full auth provider (`auth-provider.tsx`), login page (`login/page.tsx`), signup page (`signup/page.tsx`), and auth tRPC procedures.
- **Join/Leave group flow** — AI implemented the complete feature: tRPC procedures (`join.procedure.ts`, `leave.procedure.ts`), UI components (`join-group-button.tsx`, `leave-group-button.tsx`), wiring into the group header and settings page.
- **CSV import** — AI created the tRPC import procedure with Papaparse, the import dialog component, and integrated it into the expenses page.
- **Stats dashboard & charts** — AI generated Recharts-based visualizations for spending by category and participant.

### 2.2 Bug Fixes

AI identified and fixed several bugs:

| Bug | Detection | Fix |
|---|---|---|
| Category names displayed with dots (e.g., "Home.Maintenance") | User report | Realigned database categories with translation file structure (99 new categories) |
| Trailing comma in en-US.json causing Vercel build failure | Vercel build logs | Removed invalid JSON trailing comma |
| Missing Prisma DATABASE_URL env variable on Vercel | Build error | Updated schema to use correct env var name |
| `Passport` icon not existing in lucide-react | TypeScript compilation error | Replaced with `Briefcase` icon |

### 2.3 Infrastructure & Configuration

AI generated and debugged:
- `vercel.json` — Build command sequence (prisma db push → seed → generate → next build)
- GitHub Actions CI workflow — TypeScript checking, ESLint, Prettier formatting
- Dockerfile — Multi-stage build for production containers
- Environment variable validations using Zod

### 2.4 Documentation

AI generated:
- This `AI_USAGE.md` document
- Comprehensive `README.md` with full feature list, tech stack, and setup instructions
- `DECISIONS.md` with 10 major technical decisions
- `SCOPE.md` with database schema and CSV anomaly analysis
- `IMPORT_REPORT.md` with import specifications

---

## 3. Important Prompts Used

### 3.1 For Architecture Decisions

> "Interview me to better understand my request and then create a spec file. First, gather any relevant context (read files, do research, etc.). Then, use several rounds of the ask_user tool to ask non-obvious clarifying questions..."

This prompt led to the creation of the `latest-updates-spec.md` through 3 rounds of targeted questions about UI placement, data format, and access control.

### 3.2 For Bug Fixing

> "please implement [a complex new feature]"

This broad prompt triggered the AI to spawn multiple agents in parallel (file pickers, code searchers, web researchers) to gather comprehensive context before implementation. The AI used `write_todos` to create a step-by-step plan and iteratively built the feature.

### 3.3 For CSV Import

> "Import expenses_export.csv through the app (see below)"

The AI analyzed the existing CSV export format, installed Papaparse, created a tRPC mutation procedure with flexible column name matching, and built a file upload dialog component.

### 3.4 For Error Diagnosis

> "fix vercel deployment"

The AI attempted to pull Vercel deployment logs, and when credentials weren't available, analyzed the codebase changes to identify likely causes (env variable mismatch, JSON syntax error).

---

## 4. AI Mistakes & Corrections

### Case 1: Non-Existent Lucide Icon

**The Problem:**
When implementing the category icon mapping for 101 new categories, the AI used `Passport` and `Luggage` as icon names in the `lucide-react` import. These icons do not exist in the `lucide-react` library.

**How It Was Detected:**
The TypeScript compiler (`tsc --noEmit`) reported import errors:
```
Module '"lucide-react"' has no exported member 'Passport'
Module '"lucide-react"' has no exported member 'Luggage'
```

**Correction:**
The AI replaced `Passport` with `Briefcase` and `Luggage` with `Backpack`, both of which are valid Lucide icons.

**Lesson Learned:**
AI models sometimes hallucinate library exports based on semantic naming (a "Passport" icon seems like it should exist). Always run the typechecker after adding new icon imports. When using UI component libraries, verify icon names against the library's documentation or schema.

---

### Case 2: Trailing Comma in JSON Causing Production Outage

**The Problem:**
The AI added a `"Header"` translation key to `messages/en-US.json` with a trailing comma:
```json
"Header": {
    "groups": "Groups",
  },
```
This is valid JavaScript but invalid JSON. JSON strictly forbids trailing commas.

**How It Was Detected:**
The Vercel production build failed during `next build` with a JSON parse error:
```
Unable to make a module from invalid JSON
SyntaxError: trailing comma at line 65 column 3
```

**Correction:**
The AI removed the trailing comma. The JSON was validated using `python3 -c "import json; json.load(open('messages/en-US.json'))"` before redeploying.

**Lesson Learned:**
JSON and JavaScript object literals have different syntax rules. Always validate JSON files with a JSON parser after editing them. The AI should have used `JSON.parse()` validation as part of its quality check. The `messages/` directory contains 24 locale files, all of which must be valid JSON — a single syntax error in any of them will break the build.

---

### Case 3: Incorrect Git Author Configuration

**The Problem:**
After several commits, it was discovered that the git author name was set to `itsdikshita` (missing a letter) instead of the correct `itsdikshitaa`. Several commits had already been pushed to GitHub with the wrong author.

**How It Was Detected:**
The user explicitly requested: "commit by itsdikshitaa not itsdikshita or anyone, main owner". When the AI checked `git log`, it confirmed the wrong author was being used.

**Correction:**
1. The AI updated the local git config: `git config user.name "itsdikshitaa"`
2. Used `git filter-branch --env-filter` to rewrite the author name on the last 12 commits
3. Force-pushed the rewritten history: `git push origin master --force`

**Lesson Learned:**
Git author configuration must be verified at the start of a new session, especially when working on a project with specific authorship requirements. `git filter-branch` with `--env-filter` is the correct tool for rewriting commit metadata, but it requires `--force` push which rewrites shared history. This should only be done if all collaborators are aware and the branch is not shared with other active developers.

---

### Case 4 (Minor): Vercel Environment Variable Assumption

**The Problem:**
The AI assumed the Vercel deployment failure was due to a missing `DATABASE_URL` environment variable after the Prisma schema was changed from `POSTGRES_PRISMA_URL` to `DATABASE_URL`. However, the actual cause was a JSON syntax error in `messages/en-US.json`.

**How It Was Detected:**
The AI attempted to run `npx vercel inspect` but lacked authentication credentials. After the user provided a Vercel token, the actual build logs revealed the JSON parse error.

**Correction:**
The AI fixed the JSON trailing comma and redeployed.

**Lesson Learned:**
Don't guess at root causes — pull the actual error logs first. The AI should have asked the user for credentials before making assumptions about the build failure. Environment variable mismatches and syntax errors produce different Vercel build log messages, and only inspecting the logs can distinguish them.

---

## 5. Lessons Learned (All Phases)

1. **Always validate generated code** — AI-generated code, especially library imports and data files, must be validated (typecheck JSON, run `tsc`, check the build) before considering work complete.

2. **Pull error logs before diagnosing** — When a build fails, the actual error message is far more reliable than guesses about root causes.

3. **Git config is project-specific** — When working on collaborative projects, verify and set git author config at the beginning of the session.

4. **AI hallucinates library APIs** — Models may invent function names, component props, or icon exports that don't exist. Always verify against actual library documentation or type definitions.

5. **Parallel agent execution speeds development** — Spawning multiple agents simultaneously (file pickers, code searchers, bashers) dramatically reduces the time needed for context gathering and validation.

6. **Incremental implementation with type checking** — Implementing features in small, type-checked increments (rather than one large batch) catches errors earlier and makes debugging easier.

7. **CSV edge cases** — CSV parsing has many edge cases (BOM, quoted fields, encoding, line endings). Using a mature library like Papaparse instead of manual parsing is essential for robustness.

### Phase 0–4 Specific Lessons

8. **TypeScript `downlevelIteration` matters** — When spreading strings (`[...str]`), the TypeScript target must support downlevel iteration. Using `str.split('')` instead avoids the TS2802 error entirely and works with any target.

9. **Date comparison with Date objects is timezone-sensitive** — Comparing `joinedAt > expenseDate` directly on Date objects can produce false positives when dates have time components (e.g., a participant joining at 3 PM on April 8 vs an expense on April 8 at midnight). Normalize to date-only strings (YYYY-MM-DD) before comparing.

10. **tRPC input schemas enforce Zod validation** — Passing an empty string `hash: ''` when the schema requires `hash: z.string().length(8)` causes immediate Zod validation errors, not silent failures. Always propagate the actual auth hash from `useAuth()` to tRPC queries.

11. **Auth state must be threaded to child components** — Balance drill-down needed the user's auth hash to fetch expenses. Using `useAuth()` directly (following the existing pattern) is cleaner than passing it through multiple prop levels.

12. **Store anomaly details for reports** — Initially, the `ImportLog` model only stored aggregate counts (total rows, imported, skipped). The import report page couldn't show per-row anomaly details. Adding a `data` field (`String? @db.Text`) for JSON-serialized anomalies fixed this — always plan for detail requirements upfront.

13. **JSON.parse returns `unknown` in strict TypeScript** — Without a type assertion (`as T`), `JSON.parse()` returns `unknown` and accessing `.anomalies` on it produces TS18046. Always cast `JSON.parse(...)` with the expected shape.

14. **Placeholder props vs real auth tokens** — During initial development, placeholder values like `hash: ''` or fake participant IDs are tempting for getting components to typecheck. These cause runtime failures when connected to real backends. Use `enabled: isOpen && !!hash` to gate queries behind available auth state.
