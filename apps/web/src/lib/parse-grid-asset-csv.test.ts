import { describe, expect, it } from "vitest";
import { parseGridAssetCsv, splitCsvLine } from "./parse-grid-asset-csv";

describe("splitCsvLine", () => {
  it("splits plain fields", () => {
    expect(splitCsvLine("PS-140,structure,Line 1234")).toEqual([
      "PS-140",
      "structure",
      "Line 1234",
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    expect(splitCsvLine('PS-140,"Dead-end, 3-pole",115')).toEqual([
      "PS-140",
      "Dead-end, 3-pole",
      "115",
    ]);
  });

  it("treats a doubled quote as a literal quote", () => {
    expect(splitCsvLine('PS-140,"45"" pole"')).toEqual(["PS-140", '45" pole']);
  });
});

describe("parseGridAssetCsv", () => {
  it("parses a structure list", () => {
    const rows = parseGridAssetCsv(
      [
        "designation,assetType,circuitDesignation,sequence,voltageKv",
        "PS-140,structure,Line 1234,10,115",
        "PS-141,structure,Line 1234,20,115",
      ].join("\n"),
    );

    expect(rows).toEqual([
      {
        designation: "PS-140",
        assetType: "structure",
        circuitDesignation: "Line 1234",
        sequence: 10,
        voltageKv: "115",
      },
      {
        designation: "PS-141",
        assetType: "structure",
        circuitDesignation: "Line 1234",
        sequence: 20,
        voltageKv: "115",
      },
    ]);
  });

  it("accepts spreadsheet header spellings", () => {
    const rows = parseGridAssetCsv(
      ["Structure Number,Feeder,Seq,KV", "12345,23F4,1,13.8"].join("\n"),
    );

    expect(rows).toEqual([
      {
        designation: "12345",
        circuitDesignation: "23F4",
        sequence: 1,
        voltageKv: "13.8",
      },
    ]);
  });

  it("skips rows with no designation", () => {
    const rows = parseGridAssetCsv(
      ["designation,voltageKv", ",115", "PS-140,115"].join("\n"),
    );

    expect(rows).toEqual([{ designation: "PS-140", voltageKv: "115" }]);
  });

  it("drops a non-numeric sequence rather than sending NaN", () => {
    const rows = parseGridAssetCsv(
      ["designation,sequence", "PS-140,first"].join("\n"),
    );

    expect(rows).toEqual([{ designation: "PS-140" }]);
  });

  it("ignores unrecognised columns", () => {
    const rows = parseGridAssetCsv(
      ["designation,foreman,crew", "PS-140,Smith,7"].join("\n"),
    );

    expect(rows).toEqual([{ designation: "PS-140" }]);
  });

  it("throws when no designation column is present", () => {
    expect(() => parseGridAssetCsv("voltageKv,sequence\n115,10")).toThrow(
      /designation column/,
    );
  });

  it("returns nothing for empty input", () => {
    expect(parseGridAssetCsv("   \n  ")).toEqual([]);
  });
});
