<div align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  <img src="https://img.shields.io/github/stars/itsdikshitaa/JointSettle?style=social" alt="Stars" />
</div>

<br />

<div align="center">
  <h1>🤝 JointSettle</h1>
  <p><strong>Split expenses, not friendships.</strong></p>
  <p>Modern, privacy-first expense sharing for friends and family — no email, no password, just a shareable link.</p>
</div>

<div align="center">
  <a href="https://jointsettle.vercel.app" target="_blank">🌐 Live App</a>
  ·
  <a href="https://github.com/itsdikshitaa/JointSettle/issues" target="_blank">🐛 Report Bug</a>
  ·
  <a href="https://github.com/itsdikshitaa/JointSettle/discussions" target="_blank">💬 Discussions</a>
</div>

<br />

---

## 📖 About

**JointSettle** is a modern, open-source web application for effortlessly splitting expenses with friends, family, roommates, or travel companions. Just generate a unique hash, create a group, and share the link — anyone with the link and their own hash can join in.

Unlike traditional expense-splitting apps, JointSettle is:

- **🌱 No email or password** — just a simple hash-based identity
- **🔗 Shareable** — share a group link; anyone with their own hash can view and contribute
- **🚫 Ad-free** — no distractions, no tracking
- **📖 Open source** — transparent, auditable, community-driven
- **🐳 Self-hostable** — deploy your own instance with Docker

Built for groups of any size, JointSettle handles everything from simple dinner splits to complex multi-currency trip expenses with different split modes.

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Hash-Based Auth** | Generate a unique 8-character hash — no email, no password, no personal data |
| 🏠 **Groups** | Create shared spaces for trips, roommates, events, or any shared expenses |
| 💰 **Expenses** | Add, edit, categorize, and delete expenses with ease |
| 🔀 **Smart Splits** | Split evenly, by shares, by percentage, or by custom amounts |
| 🔁 **Recurring Expenses** | Set daily, weekly, or monthly recurring expenses |
| 📊 **Stats & Charts** | Beautiful pie charts and bar charts showing group spending breakdowns |
| ⚖️ **Balances** | Real-time balances showing who owes whom |
| 💳 **Reimbursements** | Optimized settlement suggestions to minimize transfers |
| 📋 **Activity Log** | Full audit trail of all group activity |
| 🏷️ **Categories** | 100+ categories across 12 groupings (Housing, Food & Dining, Shopping, Travel, etc.) |
| 💱 **Multi-Currency** | 170+ currencies with live exchange rate conversion |
| 📸 **Receipt Scanning** | AI-powered receipt OCR to auto-fill expense details |
| 📄 **Export** | Export expenses as JSON or CSV |
| 📱 **PWA Ready** | Install as a progressive web app on any device |
| 🌐 **i18n** | 23+ languages supported |
| 📱 **Responsive** | Works flawlessly on desktop, tablet, and mobile |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) with Prisma Accelerate |
| **API Layer** | [tRPC](https://trpc.io/) — end-to-end type-safe APIs |
| **Validation** | [Zod](https://zod.dev/) — schema validation |
| **Forms** | [React Hook Form](https://react-hook-form.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) — 23+ languages |
| **Auth** | Unique hash-based identity (no email/password) |
| **Hosting** | [Vercel](https://vercel.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **PWA** | [Next.js PWA](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (recommended) or npm
- **PostgreSQL** (local or remote)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/itsdikshitaa/JointSettle.git
cd JointSettle

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp container.env.example container.env
# Edit container.env with your database URL

# 4. Start the database (uses Docker)
./scripts/start-local-db.sh

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed categories (optional, run once)
npx ts-node --transpile-only prisma/seed.ts

# 7. Start the dev server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `POSTGRES_URL_NON_POOLING` | Direct PostgreSQL connection for migrations | ✅ |
| `NEXT_PUBLIC_BASE_URL` | Public base URL (e.g., `http://localhost:3000`) | Optional |
| `OPENAI_API_KEY` | For AI receipt scanning | Optional |
| `S3_UPLOAD_KEY` | S3 access key for receipt image uploads | Optional |
| `S3_UPLOAD_SECRET` | S3 secret key for receipt image uploads | Optional |
| `S3_UPLOAD_BUCKET` | S3 bucket name for receipt image uploads | Optional |
| `S3_UPLOAD_REGION` | S3 region for receipt image uploads | Optional |
| `S3_UPLOAD_ENDPOINT` | S3-compatible endpoint URL | Optional |
| `RESEND_API_KEY` | For email feedback forms | Optional |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible analytics domain | Optional |

## 🏗️ Architecture

```
src/
├── app/                        # Next.js App Router
│   ├── groups/                 # Group pages (layout, expenses, balances, stats, etc.)
│   │   └── [groupId]/          # Dynamic group routes
│   │       ├── expenses/       # Expense CRUD, list, export
│   │       ├── balances/       # Balance calculations & reimbursements
│   │       ├── stats/          # Charts & spending analytics
│   │       ├── activity/       # Activity feed
│   │       └── edit/           # Group settings
│   ├── api/                    # API routes (health, S3 upload, tRPC)
│   ├── signup/                 # Hash generation page
│   ├── login/                  # Hash login page
│   └── globals.css             # Global styles
├── components/                 # Reusable UI components
│   └── ui/                     # shadcn/ui primitives
├── lib/                        # Business logic & utilities
│   ├── auth.ts                 # Hash generation & verification
│   ├── balances.ts             # Balance calculation engine
│   ├── totals.ts               # Spending totals computation
│   ├── currency.ts             # Currency data, formatting & exchange rates
│   ├── api.ts                  # Database query functions
│   ├── schemas.ts              # Zod validation schemas
│   └── prisma.ts               # Prisma client singleton
├── trpc/                       # tRPC server & client setup
│   ├── routers/                # Procedure definitions
│   │   ├── groups/             # Group CRUD, expenses, balances, stats, activities
│   │   ├── auth/               # Auth procedures (signup, login)
│   │   └── categories/         # Category listing
│   └── client.tsx              # tRPC React client
├── i18n/                       # Internationalization config
└── messages/                   # Translation files (23 locales)
```

## 📸 Screenshots

> *Coming soon — screenshots of the dashboard, expense form, balances, and charts.*

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place. Any contributions you make are **greatly appreciated**.

1. **Fork** the project
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

See the [open issues](https://github.com/itsdikshitaa/JointSettle/issues) for feature requests and bug reports.

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features when applicable (`pnpm test`)
- Ensure all type checks pass (`pnpm check-types`)
- Ensure the app builds successfully (`pnpm build`)

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

## 💖 Support

If you find JointSettle useful, consider:

- ⭐ Starring the project on GitHub
- 🐦 Sharing it with friends
- ☕ [Supporting the project](https://github.com/sponsors/itsdikshitaa)

---

<div align="center">
  Built with ❤️ by <a href="https://dikshitaa.tech/" target="_blank">Dikshita</a> and amazing <a href="https://github.com/itsdikshitaa/JointSettle/graphs/contributors" target="_blank">contributors</a>.
  <br />
  <sub>No ads. No email. Open Source. Forever Free.</sub>
</div>
