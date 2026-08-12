import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAnonymousSession, mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

const json = { "content-type": "application/json" };

async function seedProject(role?: string) {
  const member = await createWorkspaceMember(role ? { role } : undefined);
  const { project, columns } = await createProjectFixture({
    workspaceId: member.workspace.id,
  });
  mockAuthenticatedSession(member.user);
  return { member, project, columns };
}

describe("API integration: grid assets", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("rejects unauthenticated register reads", async () => {
    mockAnonymousSession();
    const { app } = createApp();

    const response = await app.request("/api/grid-asset/project-missing");

    expect(response.status).toBe(401);
  });

  it("creates an asset and returns it in the register", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const created = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        designation: "PS-142",
        assetType: "structure",
        sequence: 20,
        voltageKv: "115",
        stationing: "12+50",
      }),
    });

    expect(created.status).toBe(200);

    const register = await app.request(`/api/grid-asset/${project.id}`);
    expect(register.status).toBe(200);

    const assets = (await register.json()) as Array<Record<string, unknown>>;
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      designation: "PS-142",
      assetType: "structure",
      sequence: 20,
      voltageKv: "115",
      taskCount: 0,
      completionPercentage: 0,
    });
  });

  it("rejects a duplicate designation within the same project", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const body = JSON.stringify({ designation: "PS-142" });

    const first = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body,
    });
    expect(first.status).toBe(200);

    const second = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body,
    });
    expect(second.status).toBe(409);
  });

  it("orders the register by sequence, putting unsequenced assets last", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    for (const asset of [
      { designation: "PS-200", sequence: 20 },
      { designation: "PS-999" },
      { designation: "PS-100", sequence: 10 },
    ]) {
      await app.request(`/api/grid-asset/${project.id}`, {
        method: "POST",
        headers: json,
        body: JSON.stringify(asset),
      });
    }

    const register = await app.request(`/api/grid-asset/${project.id}`);
    const assets = (await register.json()) as Array<{ designation: string }>;

    expect(assets.map((a) => a.designation)).toEqual([
      "PS-100",
      "PS-200",
      "PS-999",
    ]);
  });

  it("rolls task progress up per asset, counting complete and energized", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const created = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ designation: "PS-142" }),
    });
    const asset = (await created.json()) as { id: string };

    // Three tasks on the structure: one energized, one complete, one still in progress.
    for (const status of ["energized", "complete", "in-progress"]) {
      const task = await app.request(`/api/task/${project.id}`, {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          title: `${status} work at PS-142`,
          description: "",
          status,
          priority: "routine",
        }),
      });
      expect(task.status).toBe(200);

      const createdTask = (await task.json()) as { id: string };
      const linked = await app.request(
        `/api/task/grid-asset/${createdTask.id}`,
        {
          method: "PUT",
          headers: json,
          body: JSON.stringify({ gridAssetId: asset.id }),
        },
      );
      expect(linked.status).toBe(200);
    }

    const register = await app.request(`/api/grid-asset/${project.id}`);
    const assets = (await register.json()) as Array<{
      taskCount: number;
      completedTaskCount: number;
      completionPercentage: number;
    }>;

    expect(assets[0]?.taskCount).toBe(3);
    expect(assets[0]?.completedTaskCount).toBe(2);
    expect(assets[0]?.completionPercentage).toBe(67);
  });

  it("imports a structure list, creating circuits on demand", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const response = await app.request(`/api/grid-asset/${project.id}/import`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        assets: [
          {
            designation: "PS-140",
            circuitDesignation: "Line 1234",
            sequence: 10,
          },
          {
            designation: "PS-141",
            circuitDesignation: "Line 1234",
            sequence: 20,
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      created: 2,
      updated: 0,
      skipped: [],
    });

    const circuits = await app.request(`/api/circuit/${project.id}`);
    const circuitList = (await circuits.json()) as Array<{
      designation: string;
      assetCount: number;
    }>;

    expect(circuitList).toHaveLength(1);
    expect(circuitList[0]).toMatchObject({
      designation: "Line 1234",
      assetCount: 2,
    });
  });

  it("re-importing a corrected list updates in place instead of duplicating", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const importOnce = (sequence: number) =>
      app.request(`/api/grid-asset/${project.id}/import`, {
        method: "POST",
        headers: json,
        body: JSON.stringify({
          assets: [{ designation: "PS-140", sequence }],
        }),
      });

    expect(await (await importOnce(10)).json()).toMatchObject({
      created: 1,
      updated: 0,
    });
    expect(await (await importOnce(15)).json()).toMatchObject({
      created: 0,
      updated: 1,
    });

    const register = await app.request(`/api/grid-asset/${project.id}`);
    const assets = (await register.json()) as Array<{ sequence: number }>;

    expect(assets).toHaveLength(1);
    expect(assets[0]?.sequence).toBe(15);
  });

  it("reports skipped rows rather than silently dropping them", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const response = await app.request(`/api/grid-asset/${project.id}/import`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        assets: [
          { designation: "PS-140" },
          { designation: "PS-141", assetType: "not-a-real-type" },
          { designation: "" },
        ],
      }),
    });

    const result = (await response.json()) as {
      created: number;
      skipped: Array<{ designation: string; reason: string }>;
    };

    expect(result.created).toBe(1);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.map((s) => s.reason)).toEqual([
      expect.stringContaining("Unknown asset type"),
      expect.stringContaining("Missing designation"),
    ]);
  });

  it("won't attach an asset to a circuit from another project", async () => {
    const { member, project } = await seedProject();
    const other = await createProjectFixture({
      workspaceId: member.workspace.id,
      slug: "other-project",
    });
    const { app } = createApp();

    const foreignCircuit = await app.request(
      `/api/circuit/${other.project.id}`,
      {
        method: "POST",
        headers: json,
        body: JSON.stringify({ designation: "Line 9999" }),
      },
    );
    const circuit = (await foreignCircuit.json()) as { id: string };

    const response = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        designation: "PS-142",
        circuitId: circuit.id,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("won't let a plain member delete an asset", async () => {
    const { project } = await seedProject();
    const { app } = createApp();

    const created = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ designation: "PS-142" }),
    });
    const asset = (await created.json()) as { id: string };

    // Members maintain the register but deleting unlinks existing work, so it is
    // gated behind task:delete, which only admins and owners hold.
    const response = await app.request(
      `/api/grid-asset/${project.id}/${asset.id}`,
      { method: "DELETE" },
    );
    expect(response.status).toBe(403);
  });

  it("keeps tasks when their asset is deleted", async () => {
    const { project } = await seedProject("admin");
    const { app } = createApp();

    const created = await app.request(`/api/grid-asset/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ designation: "PS-142" }),
    });
    const asset = (await created.json()) as { id: string };

    const taskResponse = await app.request(`/api/task/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        title: "Set structure PS-142",
        description: "",
        status: "scheduled",
        priority: "routine",
      }),
    });
    const task = (await taskResponse.json()) as { id: string };

    const deleted = await app.request(
      `/api/grid-asset/${project.id}/${asset.id}`,
      { method: "DELETE" },
    );
    expect(deleted.status).toBe(200);

    const stillThere = await app.request(`/api/task/${task.id}`);
    expect(stillThere.status).toBe(200);
  });
});
