export type ParsedGridAssetRow = {
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

const TEXT_COLUMNS = [
  "assetType",
  "circuitDesignation",
  "description",
  "latitude",
  "longitude",
  "stationing",
  "voltageKv",
] as const;

/** Accept the header spellings a spreadsheet is likely to produce. */
const HEADER_ALIASES: Record<string, string> = {
  designation: "designation",
  structure: "designation",
  structurenumber: "designation",
  polenumber: "designation",
  tag: "designation",
  assettype: "assetType",
  type: "assetType",
  circuit: "circuitDesignation",
  circuitdesignation: "circuitDesignation",
  feeder: "circuitDesignation",
  line: "circuitDesignation",
  sequence: "sequence",
  seq: "sequence",
  voltagekv: "voltageKv",
  kv: "voltageKv",
  voltage: "voltageKv",
  stationing: "stationing",
  station: "stationing",
  latitude: "latitude",
  lat: "latitude",
  longitude: "longitude",
  lon: "longitude",
  lng: "longitude",
  description: "description",
  notes: "description",
};

/**
 * Splits one CSV line, honouring double-quoted fields so a quoted description
 * containing a comma survives intact. Doubled quotes ("") are a literal quote.
 */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

/**
 * Parses a pasted structure list into import rows. Throws when the header has no
 * recognisable designation column, since every other column is optional and an import
 * without designations would silently do nothing.
 */
export function parseGridAssetCsv(csv: string): ParsedGridAssetRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = splitCsvLine(lines[0] as string).map((column) => {
    const normalized = column.toLowerCase().replace(/[\s_-]/g, "");
    return HEADER_ALIASES[normalized] ?? "";
  });

  if (!header.includes("designation")) {
    throw new Error(
      "CSV needs a designation column (also accepted: structure, structureNumber, poleNumber, tag)",
    );
  }

  const rows: ParsedGridAssetRow[] = [];

  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const row: Record<string, string> = {};

    header.forEach((key, index) => {
      if (!key) return;
      const value = fields[index];
      if (value) row[key] = value;
    });

    const designation = row.designation;
    if (!designation) continue;

    const parsed: ParsedGridAssetRow = { designation };

    for (const column of TEXT_COLUMNS) {
      const value = row[column];
      if (value) parsed[column] = value;
    }

    if (row.sequence) {
      const sequence = Number(row.sequence);
      if (!Number.isNaN(sequence)) {
        parsed.sequence = sequence;
      }
    }

    rows.push(parsed);
  }

  return rows;
}
