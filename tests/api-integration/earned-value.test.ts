import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

const json = { "content-type": "application/json" };

async function seed() {
  // Catalog writes need workspace:manage_settings, which admins hold.
  const member = await createWorkspaceMember({ role: "admin" });
  const { project } = await createProjectFixture({
    workspaceId: member.workspace.id,
  });
  mockAuthenticatedSession(member.user);
  const { app } = createApp();
  return { member, project, app, workspaceId: member.workspace.id };
}

describe("API integration: construction unit catalog", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("imports a rate sheet and re-imports update prices in place", async () => {
    const { app, workspaceId } = await seed();

    const importOnce = (installPrice: string) =>
      app.request(`/api/construction-unit/${workspaceId}/import`, {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          units: [
            {
              code: "TP-40",
              description: "Set 40ft class 2 wood pole",
              unitOfMeasure: "EA",
              installHours: "8.5",
              installPrice,
            },
          ],
        }),
      });

    expect(await (await importOnce("1200.00")).json()).toMatchObject({
      created: 1,
      updated: 0,
      skipped: [],
    });

    expect(await (await importOnce("1350.50")).json()).toMatchObject({
      created: 0,
      updated: 1,
    });

    const list = await app.request(`/api/construction-unit/${workspaceId}`);
    const units = (await list.json()) as Array<{
      code: string;
      installPrice: string;
    }>;

    expect(units).toHaveLength(1);
    expect(units[0]?.installPrice).toBe("1350.50");
  });

  it("rejects a non-decimal rate rather than letting it break reporting later", async () => {
    const { app, workspaceId } = await seed();

    const response = await app.request(
      `/api/construction-unit/${workspaceId}/import`,
      {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          units: [
            { code: "BAD-1", description: "Bad rate", installHours: "eight" },
            { code: "OK-1", description: "Good rate", installHours: "8" },
          ],
        }),
      },
    );

    const result = (await response.json()) as {
      created: number;
      skipped: Array<{ code: string; reason: string }>;
    };

    expect(result.created).toBe(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.code).toBe("BAD-1");
    expect(result.skipped[0]?.reason).toContain("non-negative decimal");
  });
});

describe("API integration: earned value", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  async function seedPayItem(quantity = "10") {
    const ctx = await seed();
    const { app, workspaceId, project } = ctx;

    await app.request(`/api/construction-unit/${workspaceId}/import`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        units: [
          {
            code: "TP-40",
            description: "Set 40ft class 2 wood pole",
            unitOfMeasure: "EA",
            installHours: "8",
            installPrice: "1000",
            removeHours: "3",
            removePrice: "400",
          },
        ],
      }),
    });

    const list = await app.request(`/api/construction-unit/${workspaceId}`);
    const [unit] = (await list.json()) as Array<{ id: string }>;

    const created = await app.request(`/api/pay-item/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        constructionUnitId: unit?.id,
        action: "install",
        estimatedQuantity: quantity,
      }),
    });
    expect(created.status).toBe(200);
    const payItem = (await created.json()) as {
      id: string;
      unitPrice: string;
      standardHours: string;
    };

    return { ...ctx, unitId: unit?.id as string, payItem };
  }

  it("defaults price and hours from the catalog for the chosen action", async () => {
    const { payItem } = await seedPayItem();

    expect(payItem.unitPrice).toBe("1000");
    expect(payItem.standardHours).toBe("8");
  });

  it("prices a remove action off the remove rate, not the install rate", async () => {
    const { app, project, unitId } = await seedPayItem();

    const created = await app.request(`/api/pay-item/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        constructionUnitId: unitId,
        action: "remove",
        estimatedQuantity: "4",
      }),
    });

    const payItem = (await created.json()) as {
      unitPrice: string;
      standardHours: string;
    };
    expect(payItem.unitPrice).toBe("400");
    expect(payItem.standardHours).toBe("3");
  });

  it("reports a zero rollup before any production", async () => {
    const { app, project } = await seedPayItem();

    const response = await app.request(
      `/api/pay-item/${project.id}/earned-value`,
    );
    const { totals } = (await response.json()) as {
      totals: Record<string, number | null>;
    };

    expect(totals.budgetValue).toBe(10_000);
    expect(totals.budgetHours).toBe(80);
    expect(totals.earnedValue).toBe(0);
    expect(totals.percentComplete).toBe(0);
    // Null, not zero: no hours charged yet is not the same as infinitely unproductive.
    expect(totals.productivityFactor).toBeNull();
  });

  it("earns revenue and hours as production is booked", async () => {
    const { app, project, payItem } = await seedPayItem();

    for (const quantity of ["4", "2.5"]) {
      const response = await app.request(
        `/api/pay-item/${project.id}/production`,
        {
          method: "POST",
          headers: json,
          body: JSON.stringify({
            payItemId: payItem.id,
            quantity,
            entryDate: "2026-08-10T00:00:00.000Z",
          }),
        },
      );
      expect(response.status).toBe(200);
    }

    const response = await app.request(
      `/api/pay-item/${project.id}/earned-value`,
    );
    const { items, totals } = (await response.json()) as {
      items: Array<{ installedQuantity: string; percentComplete: number }>;
      totals: Record<string, number | null>;
    };

    // 6.5 of 10 installed: exact decimal arithmetic, no float drift.
    expect(items[0]?.installedQuantity).toBe("6.5");
    expect(items[0]?.percentComplete).toBe(65);
    expect(totals.earnedValue).toBe(6_500);
    expect(totals.earnedHours).toBe(52);
    expect(totals.remainingValue).toBe(3_500);
    expect(totals.percentComplete).toBe(65);
  });

  it("computes the productivity factor against actual labor hours", async () => {
    const { app, project, payItem, member } = await seedPayItem();

    await app.request(`/api/pay-item/${project.id}/production`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        payItemId: payItem.id,
        quantity: "5",
        entryDate: "2026-08-10T00:00:00.000Z",
      }),
    });

    // 5 poles x 8 standard hours = 40 earned hours. Charge 32 actual hours, so the
    // crew beat the estimate: factor 1.25, variance +8.
    const [report] = await db
      .insert(schema.dailyReportTable)
      .values({
        projectId: project.id,
        reportDate: new Date("2026-08-10T00:00:00.000Z"),
        foremanUserId: member.user.id,
        status: "approved",
      })
      .returning();

    await db.insert(schema.laborEntryTable).values([
      {
        dailyReportId: report.id,
        workerName: "Foreman",
        classification: "foreman",
        regularHours: "8",
        overtimeHours: "2",
        doubleTimeHours: "0",
      },
      {
        dailyReportId: report.id,
        workerName: "Lineman",
        classification: "journeyman",
        regularHours: "8",
        overtimeHours: "0",
        doubleTimeHours: "0",
      },
      {
        dailyReportId: report.id,
        workerName: "Groundman",
        classification: "groundman",
        regularHours: "14",
        overtimeHours: "0",
        doubleTimeHours: "0",
      },
    ]);

    const response = await app.request(
      `/api/pay-item/${project.id}/earned-value`,
    );
    const { totals } = (await response.json()) as {
      totals: Record<string, number | null>;
    };

    expect(totals.earnedHours).toBe(40);
    expect(totals.actualHours).toBe(32);
    expect(totals.hoursVariance).toBe(8);
    expect(totals.productivityFactor).toBeCloseTo(1.25, 5);
  });

  it("keeps the bid price when the catalog is repriced afterwards", async () => {
    const { app, project, workspaceId, payItem } = await seedPayItem();

    await app.request(`/api/construction-unit/${workspaceId}/import`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        units: [
          {
            code: "TP-40",
            description: "Set 40ft class 2 wood pole",
            installHours: "8",
            installPrice: "9999",
          },
        ],
      }),
    });

    await app.request(`/api/pay-item/${project.id}/production`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        payItemId: payItem.id,
        quantity: "1",
        entryDate: "2026-08-10T00:00:00.000Z",
      }),
    });

    const response = await app.request(
      `/api/pay-item/${project.id}/earned-value`,
    );
    const { totals } = (await response.json()) as {
      totals: Record<string, number>;
    };

    // Still valued at the bid rate of 1000, not the new 9999.
    expect(totals.earnedValue).toBe(1_000);
    expect(totals.budgetValue).toBe(10_000);
  });

  it("rejects a negative or non-numeric production quantity", async () => {
    const { app, project, payItem } = await seedPayItem();

    for (const quantity of ["-5", "lots"]) {
      const response = await app.request(
        `/api/pay-item/${project.id}/production`,
        {
          method: "POST",
          headers: json,
          body: JSON.stringify({
            payItemId: payItem.id,
            quantity,
            entryDate: "2026-08-10T00:00:00.000Z",
          }),
        },
      );
      expect(response.status).toBe(400);
    }
  });

  it("won't book production against another project's pay item", async () => {
    const { app, member, payItem } = await seedPayItem();
    const other = await createProjectFixture({
      workspaceId: member.workspace.id,
      slug: "other-project-ev",
    });

    const response = await app.request(
      `/api/pay-item/${other.project.id}/production`,
      {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          payItemId: payItem.id,
          quantity: "1",
          entryDate: "2026-08-10T00:00:00.000Z",
        }),
      },
    );

    expect(response.status).toBe(400);
  });

  it("removes production when its pay item is deleted", async () => {
    const { app, project, payItem } = await seedPayItem();

    await app.request(`/api/pay-item/${project.id}/production`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        payItemId: payItem.id,
        quantity: "3",
        entryDate: "2026-08-10T00:00:00.000Z",
      }),
    });

    const deleted = await app.request(
      `/api/pay-item/${project.id}/${payItem.id}`,
      { method: "DELETE" },
    );
    expect(deleted.status).toBe(200);

    const production = await app.request(
      `/api/pay-item/${project.id}/production`,
    );
    expect(await production.json()).toEqual([]);
  });
});
