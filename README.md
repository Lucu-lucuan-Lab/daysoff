
---

<img src="assets/dayoff-logo.avif" alt="DaysOff Logo" width="600">

## Kalender Cuti Indonesia (daysoff)

Cari libur panjang tanpa nebak-nebak. An intelligent annual leave optimizer designed specifically for the Indonesian
work calendar.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**daysoff** helps Indonesian workers maximize their continuous time off by strategically identifying "bridge days" (
*hari kejepit*) and long weekends. By analyzing national holidays and collective leave (*cuti bersama*), the application
provides data-driven recommendations to make the most of your annual leave budget.

## Features

- **Dynamic Optimization**: Uses a dynamic programming algorithm to calculate the most efficient use of your leave
  budget, maximizing consecutive days off without overlaps.
- **Work Week Support**: Toggle between 5-day and 6-day work weeks to match your specific employment terms.
- **Interactive Calendar**: A year-at-a-glance view that highlights holidays, collective leave, and recommended leave
  days.
- **Plan Comparison**: Compare different leave "opportunities" and see the total efficiency of your annual plan.
- **Reliable Data**: Hybrid data strategy fetching from the [Indonesian Holiday API](https://libur.deno.dev/) with
  robust local fallbacks for 2024–2026.

## Getting Started

### Prerequisites

- **Node.js**: 20.x or later
- **npm**: 10.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Lucu-lucuan-Lab/daysoff.git
   cd daysoff
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Usage

1. **Select Year**: Navigate through different years to see upcoming holiday patterns.
2. **Set Budget**: Adjust your annual leave budget (e.g., 12 days) to see how the optimizer allocates them.
3. **Toggle Work Week**: Switch between 5-day and 6-day work week modes to see how it affects long weekend
   opportunities.
4. **Review Plans**: Click on recommended plans in the sidebar to highlight them on the main calendar.

## Project Structure

```text
src/
├── app/              # Next.js App Router (pages and layouts)
│   └── _components/  # Page-specific React components
├── components/       # Reusable UI primitives (Radix, Shadcn-like)
├── data/             # Static holiday data for offline fallbacks
└── lib/              # Core business logic (Optimization, Data Fetching)
```

## Development

### Testing

The project uses the native Node.js test runner for unit testing core logic.

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Build

Create a production-ready build:

```bash
npm run build
```

## Contributing

Contributions are welcome. Please ensure that your changes adhere to the following guidelines:

- **Logic First**: Keep complex date logic in `src/lib` and ensure it is covered by unit tests.
- **No Comments**: We prefer self-documenting code. Use clear naming and structure instead of comments.
- **Commit Style**: Use the imperative mood (e.g., `fix:`, `feat:`, `refactor:`) and match the repository's existing
  style.

## License

This project is private and for internal use within Lucu-lucuan Lab. Refer to the repository settings for licensing
details.