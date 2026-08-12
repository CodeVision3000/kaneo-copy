import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { outageSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createOutageCtrl from "./controllers/create-outage";
import deleteOutageCtrl from "./controllers/delete-outage";
import getOutagesCtrl from "./controllers/get-outages";
import setOutageTasksCtrl from "./controllers/set-outage-tasks";
import updateOutageCtrl from "./controllers/update-outage";
import { OUTAGE_STATUSES, OUTAGE_TYPES } from "./gating-types";

const optionalText = v.optional(v.nullable(v.string()));
const optionalDate = v.optional(v.nullable(v.string()));

/** Dates arrive as ISO strings; absent keys leave stored values alone. */
function toDates<K extends string>(
  input: Record<K, string | null | undefined>,
) {
  const dates: Record<string, Date | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    dates[key] = value === null ? null : new Date(value as string);
  }
  return dates;
}

const outage = new Hono<{
  Variables: {
    userId: string;
    workspaceId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listOutages",
      tags: ["Outages"],
      description:
        "List clearances and outage windows for a project, soonest first, with the number of tasks each gates",
      responses: {
        200: {
          description: "Outages with gated task counts",
          content: {
            "application/json": { schema: resolver(v.array(outageSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getOutagesCtrl(projectId));
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createOutage",
      tags: ["Outages"],
      description: "Request a clearance, outage window, or hot line tag",
      responses: {
        200: {
          description: "Outage created",
          content: {
            "application/json": { schema: resolver(outageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        title: v.pipe(v.string(), v.minLength(1)),
        circuitId: optionalText,
        outageNumber: optionalText,
        type: v.optional(v.picklist(OUTAGE_TYPES)),
        status: v.optional(v.picklist(OUTAGE_STATUSES)),
        requestedStart: optionalDate,
        requestedEnd: optionalDate,
        notes: optionalText,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { requestedStart, requestedEnd, ...rest } = c.req.valid("json");

      const created = await createOutageCtrl({
        projectId,
        ...rest,
        requestedById: c.get("userId"),
        ...toDates({ requestedStart, requestedEnd }),
      });

      return c.json(created);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updateOutage",
      tags: ["Outages"],
      description:
        "Update an outage: move it through the approval flow, record the approved window, or log actual start and end",
      responses: {
        200: {
          description: "Outage updated",
          content: {
            "application/json": { schema: resolver(outageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.optional(v.string()),
        circuitId: optionalText,
        outageNumber: optionalText,
        type: v.optional(v.picklist(OUTAGE_TYPES)),
        status: v.optional(v.picklist(OUTAGE_STATUSES)),
        approvedBy: optionalText,
        notes: optionalText,
        requestedStart: optionalDate,
        requestedEnd: optionalDate,
        approvedStart: optionalDate,
        approvedEnd: optionalDate,
        actualStart: optionalDate,
        actualEnd: optionalDate,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const {
        requestedStart,
        requestedEnd,
        approvedStart,
        approvedEnd,
        actualStart,
        actualEnd,
        ...rest
      } = c.req.valid("json");

      const updated = await updateOutageCtrl({
        id,
        projectId,
        ...rest,
        ...toDates({
          requestedStart,
          requestedEnd,
          approvedStart,
          approvedEnd,
          actualStart,
          actualEnd,
        }),
      });

      return c.json(updated);
    },
  )
  .put(
    "/:projectId/:id/tasks",
    describeRoute({
      operationId: "setOutageTasks",
      tags: ["Outages"],
      description:
        "Replace the set of tasks this clearance gates. Send the whole set.",
      responses: {
        200: {
          description: "Gated tasks updated",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  outageId: v.string(),
                  taskIds: v.array(v.string()),
                }),
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator("json", v.object({ taskIds: v.array(v.string()) })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const { taskIds } = c.req.valid("json");
      return c.json(await setOutageTasksCtrl(id, projectId, taskIds));
    },
  )
  .delete(
    "/:projectId/:id",
    describeRoute({
      operationId: "deleteOutage",
      tags: ["Outages"],
      description: "Delete an outage. Its gated tasks are untouched.",
      responses: {
        200: {
          description: "Outage deleted",
          content: {
            "application/json": { schema: resolver(outageSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deleteOutageCtrl(id, projectId));
    },
  );

export default outage;
