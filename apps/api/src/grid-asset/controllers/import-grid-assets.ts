import { and, eq, inArray } from "drizzle-orm";
import db from "../../database";
import { circuitTable, gridAssetTable } from "../../database/schema";
import { GRID_ASSET_TYPES } from "../asset-types";

export type ImportGridAssetRow = {
  designation: string;
  assetType?: string;
  circuitDesignation?: string;
  description?: string;
  sequence?: number;
  latitude?: string;
  longitude?: string;
  stationing?: string;
  voltageKv?: string;
};

export type ImportGridAssetsResult = {
  created: number;
  updated: number;
  skipped: Array<{ designation: string; reason: string }>;
};

/**
 * Bulk-loads a structure list. Utility structure registers arrive as spreadsheets, so
 * this is the normal way a project gets populated rather than one-at-a-time entry.
 *
 * Rows are matched on designation, which is unique per project: a re-import of a
 * corrected list updates in place instead of duplicating the register. Circuits are
 * referenced by designation and created on demand, because the spreadsheet names a line
 * ("Line 1234") and has no idea what our circuit ids are.
 */
async function importGridAssets(
  projectId: string,
  rows: ImportGridAssetRow[],
): Promise<ImportGridAssetsResult> {
  const skipped: ImportGridAssetsResult["skipped"] = [];
  const validTypes = new Set<string>(GRID_ASSET_TYPES);

  // Collapse duplicate designations within the payload; last row wins.
  const byDesignation = new Map<string, ImportGridAssetRow>();
  for (const row of rows) {
    const designation = row.designation?.trim();

    if (!designation) {
      skipped.push({ designation: "", reason: "Missing designation" });
      continue;
    }

    if (row.assetType && !validTypes.has(row.assetType)) {
      skipped.push({
        designation,
        reason: `Unknown asset type "${row.assetType}"`,
      });
      continue;
    }

    byDesignation.set(designation, { ...row, designation });
  }

  if (byDesignation.size === 0) {
    return { created: 0, updated: 0, skipped };
  }

  return db.transaction(async (tx) => {
    // Resolve every referenced circuit up front, creating the missing ones.
    const circuitNames = new Set(
      [...byDesignation.values()]
        .map((row) => row.circuitDesignation?.trim())
        .filter((name): name is string => Boolean(name)),
    );

    const circuitIds = new Map<string, string>();

    if (circuitNames.size > 0) {
      const existingCircuits = await tx
        .select({ id: circuitTable.id, designation: circuitTable.designation })
        .from(circuitTable)
        .where(eq(circuitTable.projectId, projectId));

      for (const circuit of existingCircuits) {
        circuitIds.set(circuit.designation, circuit.id);
      }

      for (const name of circuitNames) {
        if (circuitIds.has(name)) continue;

        const [created] = await tx
          .insert(circuitTable)
          .values({ projectId, designation: name })
          .returning({ id: circuitTable.id });

        if (created) {
          circuitIds.set(name, created.id);
        }
      }
    }

    const designations = [...byDesignation.keys()];
    const existingAssets = await tx
      .select({
        id: gridAssetTable.id,
        designation: gridAssetTable.designation,
      })
      .from(gridAssetTable)
      .where(
        and(
          eq(gridAssetTable.projectId, projectId),
          inArray(gridAssetTable.designation, designations),
        ),
      );

    const existingByDesignation = new Map(
      existingAssets.map((asset) => [asset.designation, asset.id]),
    );

    let created = 0;
    let updated = 0;

    for (const [designation, row] of byDesignation) {
      const circuitId = row.circuitDesignation?.trim()
        ? (circuitIds.get(row.circuitDesignation.trim()) ?? null)
        : undefined;

      const values = {
        assetType: row.assetType ?? "structure",
        description: row.description ?? null,
        sequence: row.sequence ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        stationing: row.stationing ?? null,
        voltageKv: row.voltageKv ?? null,
        ...(circuitId !== undefined ? { circuitId } : {}),
      };

      const existingId = existingByDesignation.get(designation);

      if (existingId) {
        await tx
          .update(gridAssetTable)
          .set(values)
          .where(eq(gridAssetTable.id, existingId));
        updated += 1;
      } else {
        await tx
          .insert(gridAssetTable)
          .values({ projectId, designation, ...values });
        created += 1;
      }
    }

    return { created, updated, skipped };
  });
}

export default importGridAssets;
