# SPARC

**S**argent **P**roject **A**nd **R**esource **C**ontrol — project management for electric
utility **transmission**, **distribution**, and **substation** construction.

SPARC is a fork of [Kaneo](https://github.com/usekaneo/kaneo) (MIT). It keeps Kaneo's
workspaces, boards, and collaboration and replaces the generic project vocabulary with the
way utility construction actually runs.

## What makes it utility-specific

**The workflow ends at energization.** Tasks move Scheduled → Ready to Build → In Progress
→ Awaiting Clearance → Awaiting Inspection → Complete → Energized. Only *Energized* is
terminal: construction-complete work isn't finished until the circuit is back in service.
Priorities are the work-order ladder crews actually use — routine, expedited, urgent,
emergency.

**Work hangs off the grid, not a feature list.** Circuits (lines, feeders, buses) carry
voltage class and end substations. Grid assets are the discrete positions on them —
structures, spans, bays, equipment, foundations, duct banks, work-order locations — with
designations, ordering sequence, coordinates, and stationing. Tasks attach to an asset, so
"how far along is PS-142" is a question the app can answer. Structure lists import from CSV
because that's how they arrive.

**Nothing starts until it's cleared.** Outages and clearances track three separate windows:
what was requested, what the utility granted, and what actually happened. Permits track ROW
access, road openings, DOT and railroad crossings, and environmental approvals with
expiries. Inspections can be marked as **hold points**, and a hold point blocks its task
from completing until it passes or is waived — enforced on every status path, including
bulk moves.

**It's priced in construction units.** The workspace holds a CU catalog — the utility's own
codes with a unit of measure, standard manhours, and separate install / remove / transfer
rates, loaded from a rate-sheet CSV. A project's estimate is a list of pay items; production
is that list filled in as work gets done:

```
earned revenue = installed qty × unit price
earned hours   = installed qty × standard hours
productivity   = earned hours ÷ actual hours from the daily reports
```

Pay items snapshot the rate they were bid at, so repricing the catalog never restates work
already sold. Money and quantities are stored as exact decimals and the arithmetic runs in
Postgres, not in floats.

**Crews file the day.** Crews, crew members, and equipment are workspace-level, because
crews and iron move between jobs. Daily reports carry weather, work performed, delays, a
tailboard/JHA with minimum approach distance and grounding plan, labor hours by
classification with overtime, and equipment hours.

## Quick start

```bash
pnpm install
cp .env.sample .env      # set DATABASE_URL and AUTH_SECRET
pnpm dev                 # API on :1337, web on :5173
```

Migrations run automatically on API startup.

## Tests

```bash
pnpm test                # unit tests (API, web, packages)
pnpm test:integration    # requires PostgreSQL; DATABASE_URL must end in _test
```

## Stack

Hono + Drizzle + PostgreSQL on the API, React 19 + TanStack Router/Query + Tailwind v4 on
the web, in a pnpm/Turborepo monorepo. See `CLAUDE.md` for architecture and conventions.

## License

MIT, inherited from Kaneo. See [LICENSE](./LICENSE).
