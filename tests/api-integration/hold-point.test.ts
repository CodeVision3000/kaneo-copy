import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

const json = { "content-type": "application/json" };

async function seed() {
  const member = await createWorkspaceMember({ role: "admin" });
  const { project } = await createProjectFixture({
    workspaceId: member.workspace.id,
  });
  mockAuthenticatedSession(member.user);
  const { app } = createApp();
  return { member, project, app };
}

async function createTask(
  app: ReturnType<typeof createApp>["app"],
  projectId: string,
  status = "in-progress",
) {
  const response = await app.request(`/api/task/${projectId}`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({
      title: "Set foundation at PS-142",
      description: "",
      status,
      priority: "routine",
    }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as { id: string };
}

async function addInspection(
  app: ReturnType<typeof createApp>["app"],
  projectId: string,
  body: Record<string, unknown>,
) {
  const response = await app.request(`/api/inspection/${projectId}`, {
    method: "POST",
    headers: json,
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as { id: string };
}

const setStatus = (
  app: ReturnType<typeof createApp>["app"],
  taskId: string,
  status: string,
) =>
  app.request(`/api/task/status/${taskId}`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify({ status }),
  });

describe("API integration: inspection hold points", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("blocks completing a task with a pending hold point", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);

    await addInspection(app, project.id, {
      type: "rebar",
      taskId: task.id,
      isHoldPoint: true,
      description: "Rebar inspection before pour",
    });

    const response = await setStatus(app, task.id, "complete");

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toContain(
      "Rebar inspection before pour",
    );
  });

  it("allows completion once the hold point passes", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);
    const inspection = await addInspection(app, project.id, {
      type: "rebar",
      taskId: task.id,
      isHoldPoint: true,
    });

    expect((await setStatus(app, task.id, "complete")).status).toBe(409);

    const passed = await app.request(
      `/api/inspection/${project.id}/${inspection.id}`,
      {
        method: "PUT",
        headers: json,
        body: JSON.stringify({ status: "passed" }),
      },
    );
    expect(passed.status).toBe(200);

    expect((await setStatus(app, task.id, "complete")).status).toBe(200);
  });

  it("treats a waiver as clearing the hold point", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);
    const inspection = await addInspection(app, project.id, {
      type: "punchlist",
      taskId: task.id,
      isHoldPoint: true,
    });

    await app.request(`/api/inspection/${project.id}/${inspection.id}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify({ status: "waived" }),
    });

    expect((await setStatus(app, task.id, "complete")).status).toBe(200);
  });

  it("still blocks energizing, not just completing", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);
    await addInspection(app, project.id, {
      type: "relay_functional",
      taskId: task.id,
      isHoldPoint: true,
    });

    expect((await setStatus(app, task.id, "energized")).status).toBe(409);
  });

  it("lets work move backwards while a hold point is open", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);
    await addInspection(app, project.id, {
      type: "rebar",
      taskId: task.id,
      isHoldPoint: true,
      status: "failed",
    });

    // A failed inspection has to be able to send work back, otherwise the failure
    // can never be acted on.
    expect((await setStatus(app, task.id, "ready")).status).toBe(200);
    expect((await setStatus(app, task.id, "awaiting-inspection")).status).toBe(
      200,
    );
  });

  it("ignores inspections that are not hold points", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);
    await addInspection(app, project.id, {
      type: "punchlist",
      taskId: task.id,
      isHoldPoint: false,
    });

    expect((await setStatus(app, task.id, "complete")).status).toBe(200);
  });

  it("skips blocked tasks in a bulk move instead of failing the whole selection", async () => {
    const { project, app } = await seed();
    const blocked = await createTask(app, project.id);
    const clear = await createTask(app, project.id);

    await addInspection(app, project.id, {
      type: "torque",
      taskId: blocked.id,
      isHoldPoint: true,
    });

    const response = await app.request("/api/task/bulk", {
      method: "PATCH",
      headers: json,
      body: JSON.stringify({
        taskIds: [blocked.id, clear.id],
        operation: "updateStatus",
        value: "complete",
      }),
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      updatedCount: number;
      skipped: Array<{ taskId: string; reason: string }>;
    };

    expect(result.updatedCount).toBe(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.taskId).toBe(blocked.id);
    expect(result.skipped[0]?.reason).toContain("hold point");
  });

  it("rejects a hold point pointing at another project's task", async () => {
    const { member, project, app } = await seed();
    const other = await createProjectFixture({
      workspaceId: member.workspace.id,
      slug: "other-project",
    });
    const foreignTask = await createTask(app, other.project.id);

    const response = await app.request(`/api/inspection/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        type: "rebar",
        taskId: foreignTask.id,
        isHoldPoint: true,
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe("API integration: outages", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("requests an outage and reports how many tasks it gates", async () => {
    const { project, app } = await seed();
    const task = await createTask(app, project.id);

    const created = await app.request(`/api/outage/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        title: "Clearance for PS-140 to PS-145 wire pull",
        type: "clearance",
        outageNumber: "CLR-1",
        requestedStart: "2026-09-01T06:00:00.000Z",
        requestedEnd: "2026-09-01T18:00:00.000Z",
      }),
    });
    expect(created.status).toBe(200);
    const outage = (await created.json()) as { id: string; status: string };
    expect(outage.status).toBe("draft");

    const gated = await app.request(
      `/api/outage/${project.id}/${outage.id}/tasks`,
      {
        method: "PUT",
        headers: json,
        body: JSON.stringify({ taskIds: [task.id] }),
      },
    );
    expect(gated.status).toBe(200);

    const list = await app.request(`/api/outage/${project.id}`);
    const outages = (await list.json()) as Array<{ gatedTaskCount: number }>;
    expect(outages[0]?.gatedTaskCount).toBe(1);
  });

  it("rejects a window that ends before it starts", async () => {
    const { project, app } = await seed();

    const response = await app.request(`/api/outage/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        title: "Backwards window",
        requestedStart: "2026-09-02T06:00:00.000Z",
        requestedEnd: "2026-09-01T06:00:00.000Z",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("validates the approved window against the stored request", async () => {
    const { project, app } = await seed();

    const created = await app.request(`/api/outage/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ title: "Clearance" }),
    });
    const outage = (await created.json()) as { id: string };

    const bad = await app.request(`/api/outage/${project.id}/${outage.id}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify({
        status: "approved",
        approvedStart: "2026-09-02T06:00:00.000Z",
        approvedEnd: "2026-09-01T06:00:00.000Z",
      }),
    });
    expect(bad.status).toBe(400);

    const good = await app.request(`/api/outage/${project.id}/${outage.id}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify({
        status: "approved",
        approvedStart: "2026-09-01T06:00:00.000Z",
        approvedEnd: "2026-09-01T18:00:00.000Z",
        approvedBy: "System Operator",
      }),
    });
    expect(good.status).toBe(200);
  });

  it("won't gate a task from another project", async () => {
    const { member, project, app } = await seed();
    const other = await createProjectFixture({
      workspaceId: member.workspace.id,
      slug: "other-project-2",
    });
    const foreignTask = await createTask(app, other.project.id);

    const created = await app.request(`/api/outage/${project.id}`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ title: "Clearance" }),
    });
    const outage = (await created.json()) as { id: string };

    const response = await app.request(
      `/api/outage/${project.id}/${outage.id}/tasks`,
      {
        method: "PUT",
        headers: json,
        body: JSON.stringify({ taskIds: [foreignTask.id] }),
      },
    );

    expect(response.status).toBe(400);
  });
});
