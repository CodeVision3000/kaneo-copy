import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { PERMIT_STATUSES, PERMIT_TYPES } from "../outage/gating-types";
import { permitSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getPermitsCtrl from "./controllers/get-permits";
import {
  createPermit,
  deletePermit,
  updatePermit,
} from "./controllers/upsert-permit";

const optionalText = v.optional(v.nullable(v.string()));
const optionalDate = v.optional(v.nullable(v.string()));

const permitBody = {
  permitNumber: optionalText,
  description: optionalText,
  issuingAuthority: optionalText,
  status: v.optional(v.picklist(PERMIT_STATUSES)),
  gridAssetId: optionalText,
  notes: optionalText,
  appliedAt: optionalDate,
  issuedAt: optionalDate,
  expiresAt: optionalDate,
};

function toDates(input: Record<string, string | null | undefined>) {
  const dates: Record<string, Date | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    dates[key] = value === null ? null : new Date(value);
  }
  return dates;
}

const permit = new Hono<{
  Variables: { userId: string; workspaceId: string };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listPermits",
      tags: ["Permits"],
      description: "List project permits, soonest expiry first",
      responses: {
        200: {
          description: "Permits",
          content: {
            "application/json": { schema: resolver(v.array(permitSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getPermitsCtrl(projectId));
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createPermit",
      tags: ["Permits"],
      description: "Track a permit the work depends on",
      responses: {
        200: {
          description: "Permit created",
          content: { "application/json": { schema: resolver(permitSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({ type: v.picklist(PERMIT_TYPES), ...permitBody }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { appliedAt, issuedAt, expiresAt, ...rest } = c.req.valid("json");
      const created = await createPermit(projectId, {
        ...rest,
        ...toDates({ appliedAt, issuedAt, expiresAt }),
      });
      return c.json(created);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updatePermit",
      tags: ["Permits"],
      description: "Update a permit's status or dates",
      responses: {
        200: {
          description: "Permit updated",
          content: { "application/json": { schema: resolver(permitSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({ type: v.optional(v.picklist(PERMIT_TYPES)), ...permitBody }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const { appliedAt, issuedAt, expiresAt, ...rest } = c.req.valid("json");
      const updated = await updatePermit(id, projectId, {
        ...rest,
        ...toDates({ appliedAt, issuedAt, expiresAt }),
      });
      return c.json(updated);
    },
  )
  .delete(
    "/:projectId/:id",
    describeRoute({
      operationId: "deletePermit",
      tags: ["Permits"],
      description: "Delete a permit",
      responses: {
        200: {
          description: "Permit deleted",
          content: { "application/json": { schema: resolver(permitSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deletePermit(id, projectId));
    },
  );

export default permit;
