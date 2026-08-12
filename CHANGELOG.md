# Changelog

## Unreleased

SPARC is a fork of [Kaneo](https://github.com/usekaneo/kaneo) specialized for electric
utility transmission, distribution, and substation construction.

### Added
- Utility construction workflow: Scheduled → Ready to Build → In Progress → Awaiting
  Clearance → Awaiting Inspection → Complete → Energized, with Energized as the only
  terminal state.
- Utility work-order priority ladder: routine, expedited, urgent, emergency.
- Project attributes: discipline, utility client, contract and work-order numbers,
  contract type, voltage class, and mobilization / energization / substantial-completion
  dates.
- Circuits and grid assets as the work-breakdown spine, with CSV import of structure
  lists and per-asset progress rollups.
- Outages and clearances with requested, approved, and actual windows; permits; and
  inspections with hold points that block task completion until they pass or are waived.
- Construction-unit catalog with CSV import of utility rate sheets, pay items, production
  entries, and earned-value reporting (budget vs earned revenue, budget vs earned vs
  actual hours, productivity factor).
- Crews, crew members, equipment, daily reports, tailboards, and labor and equipment
  hour entries.
