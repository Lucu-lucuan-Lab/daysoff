# Kalender Cuti Indonesia (daysoff)

A Next.js web application designed to optimize annual leave planning for Indonesian workers. It calculates the most efficient use of PTO (Paid Time Off) by identifying bridge days (hari kejepit) and long weekends around national holidays and collective leave (cuti bersama).

## How It Works

The core of the application is a recommendation engine (`src/lib/recommendations.ts`) that:
1. Ingests official holiday data via `libur.deno.dev` (with local fallbacks up to 2026).
2. Scans for "opportunities" (windows of time where taking 1-5 days of leave yields disproportionately long continuous breaks).
3. Uses a dynamic programming approach to pack the highest-value opportunities into a user-defined annual leave budget without overlapping dates.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Radix UI Primitives, Lucide
- **Date Math**: `date-fns`
- **Testing**: Node.js native test runner (`node --test`)

## Local Development

Requires Node.js 20+.

```bash
# Clone and install
git clone https://github.com/your-org/daysoff.git
cd daysoff
npm install

# Start the dev server
npm run dev

# Run unit tests
npm test
```

## Project Structure

- `/src/app` - Next.js App Router (pages and layouts).
- `/src/app/_components` - Domain-specific UI components (e.g., calendar grids, plan cards).
- `/src/lib` - Core business logic and data fetching hooks. We keep this pure and framework-agnostic where possible.
- `/src/data` - Static JSON/TS fallbacks for holiday data (2024-2026).

## Contributing

We welcome pull requests. When contributing:

- **Keep it focused**: One PR, one scope.
- **Commit messages**: Use imperative mood (e.g., `fix: handle leap year calculation`, `feat: add 2027 holiday data`). Follow the existing commit style of the repository (`git log -n 5`).
- **Code style**: Do not add inline or block comments. The code should explain itself through variable naming, module structure, and clear types.
- **Testing**: If you touch `src/lib/recommendations.ts` or date math, add a corresponding test in `src/lib/*.test.ts`.
