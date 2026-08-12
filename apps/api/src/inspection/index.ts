import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { INSPECTION_STATUSES, INSPECTION_TYPES } from "../outage/gating-types";
import { inspectionSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getInspectionsCtrl from "./controllers/get-inspections";
import {
  createInspection,
  deleteInspection,
  updateInspection,
} from "./controllers/upsert-inspection";

const optionalText = v.optional(v.nullable(v.string()));
const optionalDate = v.optional(v.nullable(v.string()));

const inspectionBody = {
  description: optionalText,
  isHoldPoint: v.optional(v.boolean()),
  status: v.optional(v.picklist(INSPECTION_STATUSES)),
  inspectorName: optionalText,
  result: optionalText,
  readings: v.optional(v.nullable(v.record(v.string(), v.unknown()))),
  taskId: optionalText,
  gridAssetId: optionalText,
  scheduledFor: optionalDate,
  performedAt: optionalDate,
};

function toDates(input: Record<string, string | null | undefined>) {
  const dates: Record<string, Date | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    dates[key] = value === null ? null : new Date(value);
  }
  return dates;
}

const inspection = new Hono<{
  Variables: { userId: string; workspaceId: string };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listInspections",
      tags: ["Inspections"],
      description:
        "List inspections and hold points, soonest scheduled first. Filter by taskId for a single task's hold points.",
      responses: {
        200: {
          description: "Inspections",
          content: {
            "application/json": { schema: resolver(v.array(inspectionSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator("query", v.object({ taskId: v.optional(v.string()) })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { taskId } = c.req.valid("query");
      return c.json(await getInspectionsCtrl(projectId, taskId));
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createInspection",
      tags: ["Inspections"],
      description:
        "Add an inspection. Set isHoldPoint to block completing its task until the inspection passes or is waived.",
      responses: {
        200: {
          description: "Inspection created",
          content: {
            "application/json": { schema: resolver(inspectionSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({ type: v.picklist(INSPECTION_TYPES), ...inspectionBody }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { scheduledFor, performedAt, ...rest } = c.req.valid("json");
      const created = await createInspection(projectId, {
        ...rest,
        ...toDates({ scheduledFor, performedAt }),
      });
      return c.json(created);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updateInspection",
      tags: ["Inspections"],
      description: "Record an inspection result, readings, or reschedule it",
      responses: {
        200: {
          description: "Inspection updated",
          content: {
            "application/json": { schema: resolver(inspectionSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({
        type: v.optional(v.picklist(INSPECTION_TYPES)),
        ...inspectionBody,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const { scheduledFor, performedAt, ...rest } = c.req.valid("json");
      const updated = await updateInspection(id, projectId, {
        ...rest,
        ...toDates({ scheduledFor, performedAt }),
      });
      return c.json(updated);
    },
  )
  .delete(
    "/:projectId/:id",
    describeRoute({
      operationId: "deleteInspection",
      tags: ["Inspections"],
      description: "Delete an inspection",
      responses: {
        200: {
          description: "Inspection deleted",
          content: {
            "application/json": { schema: resolver(inspectionSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deleteInspection(id, projectId));
    },
  );

export default inspection;
