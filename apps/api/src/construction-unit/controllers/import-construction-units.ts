import { and, eq, inArray } from "drizzle-orm";
import db from "../../database";
import { constructionUnitTable } from "../../database/schema";
import { isDecimalString, UNITS_OF_MEASURE } from "../unit-types";

export type ImportConstructionUnitRow = {
  code: string;
  description?: string;
  unitOfMeasure?: string;
  discipline?: string;
  installHours?: string;
  removeHours?: string;
  transferHours?: string;
  installPrice?: string;
  removePrice?: string;
  transferPrice?: string;
};

export type ImportConstructionUnitsResult = {
  created: number;
  updated: number;
  skipped: Array<{ code: string; reason: string }>;
};

const DECIMAL_FIELDS = [
  "installHours",
  "removeHours",
  "transferHours",
  "installPrice",
  "removePrice",
  "transferPrice",
] as const;

/**
 * Bulk-loads a CU catalog. Utilities publish these as spreadsheets running to hundreds of
 * codes, so CSV import is the normal way a workspace gets one -- there is no seeded
 * catalog because every utility's codes differ.
 *
 * Rows are matched on code, unique per workspace, so re-importing a revised rate sheet
 * updates prices in place. Existing pay items keep the price they were bid at, because
 * pay_item snapshots unitPrice rather than reading through to the catalog.
 */
async function importConstructionUnits(
  workspaceId: string,
  rows: ImportConstructionUnitRow[],
): Promise<ImportConstructionUnitsResult> {
  const skipped: ImportConstructionUnitsResult["skipped"] = [];
  const validUnits = new Set<string>(UNITS_OF_MEASURE);
  const byCode = new Map<string, ImportConstructionUnitRow>();

  for (const row of rows) {
    const code = row.code?.trim();

    if (!code) {
      skipped.push({ code: "", reason: "Missing code" });
      continue;
    }

    if (!row.description?.trim()) {
      skipped.push({ code, reason: "Missing description" });
      continue;
    }

    if (row.unitOfMeasure && !validUnits.has(row.unitOfMeasure.trim())) {
      skipped.push({
        code,
        reason: `Unknown unit of measure "${row.unitOfMeasure}"`,
      });
      continue;
    }

    // Reject bad decimals here rather than letting a ::numeric cast fail later at
    // read time, which would break the whole earned-value query.
    const badField = DECIMAL_FIELDS.find((field) => {
      const value = row[field];
      return value !== undefined && value !== "" && !isDecimalString(value);
    });

    if (badField) {
      skipped.push({
        code,
        reason: `${badField} must be a non-negative decimal, got "${row[badField]}"`,
      });
      continue;
    }

    byCode.set(code, { ...row, code });
  }

  if (byCode.size === 0) {
    return { created: 0, updated: 0, skipped };
  }

  return db.transaction(async (tx) => {
    const codes = [...byCode.keys()];
    const existing = await tx
      .select({
        id: constructionUnitTable.id,
        code: constructionUnitTable.code,
      })
      .from(constructionUnitTable)
      .where(
        and(
          eq(constructionUnitTable.workspaceId, workspaceId),
          inArray(constructionUnitTable.code, codes),
        ),
      );

    const existingByCode = new Map(existing.map((row) => [row.code, row.id]));

    let created = 0;
    let updated = 0;

    for (const [code, row] of byCode) {
      const values = {
        description: row.description?.trim() ?? code,
        unitOfMeasure: row.unitOfMeasure?.trim() || "EA",
        discipline: row.discipline?.trim() || null,
        installHours: emptyToNull(row.installHours),
        removeHours: emptyToNull(row.removeHours),
        transferHours: emptyToNull(row.transferHours),
        installPrice: emptyToNull(row.installPrice),
        removePrice: emptyToNull(row.removePrice),
        transferPrice: emptyToNull(row.transferPrice),
      };

      const existingId = existingByCode.get(code);

      if (existingId) {
        await tx
          .update(constructionUnitTable)
          .set(values)
          .where(eq(constructionUnitTable.id, existingId));
        updated += 1;
      } else {
        await tx
          .insert(constructionUnitTable)
          .values({ workspaceId, code, ...values });
        created += 1;
      }
    }

    return { created, updated, skipped };
  });
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export default importConstructionUnits;
