import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { CIRCUIT_TYPES } from "../grid-asset/asset-types";
import { circuitSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createCircuitCtrl from "./controllers/create-circuit";
import deleteCircuitCtrl from "./controllers/delete-circuit";
import getCircuitsCtrl from "./controllers/get-circuits";
import updateCircuitCtrl from "./controllers/update-circuit";

const optionalText = v.optional(v.nullable(v.string()));

const circuitBody = {
  name: optionalText,
  type: v.optional(v.picklist(CIRCUIT_TYPES)),
  voltageKv: optionalText,
  substationFrom: optionalText,
  substationTo: optionalText,
};

/**
 * Permissions track tasks, not project settings. The register is the work-breakdown that
 * tasks hang off, so anyone who can create and update tasks can maintain it. Deletion is
 * gated harder because it unlinks existing work.
 */
const circuit = new Hono<{
  Variables: {
    userId: string;
    workspaceId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listCircuits",
      tags: ["Circuits"],
      description: "List the lines, feeders, and buses in a project",
      responses: {
        200: {
          description: "Circuits with asset counts",
          content: {
            "application/json": { schema: resolver(v.array(circuitSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getCircuitsCtrl(projectId));
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createCircuit",
      tags: ["Circuits"],
      description: "Add a line, feeder, or bus",
      responses: {
        200: {
          description: "Circuit created",
          content: {
            "application/json": { schema: resolver(circuitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        designation: v.pipe(v.string(), v.minLength(1)),
        ...circuitBody,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const created = await createCircuitCtrl({
        projectId,
        ...c.req.valid("json"),
      });
      return c.json(created);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updateCircuit",
      tags: ["Circuits"],
      description: "Update a circuit",
      responses: {
        200: {
          description: "Circuit updated",
          content: {
            "application/json": { schema: resolver(circuitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({ designation: v.optional(v.string()), ...circuitBody }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const updated = await updateCircuitCtrl({
        id,
        projectId,
        ...c.req.valid("json"),
      });
      return c.json(updated);
    },
  )
  .delete(
    "/:projectId/:id",
    describeRoute({
      operationId: "deleteCircuit",
      tags: ["Circuits"],
      description: "Delete a circuit. Its assets survive, unlinked.",
      responses: {
        200: {
          description: "Circuit deleted",
          content: {
            "application/json": { schema: resolver(circuitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deleteCircuitCtrl(id, projectId));
    },
  );

export default circuit;
