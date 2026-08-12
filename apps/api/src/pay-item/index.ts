import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { PAY_ITEM_ACTIONS } from "../construction-unit/unit-types";
import {
  earnedValueSchema,
  payItemSchema,
  productionEntrySchema,
} from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getEarnedValueCtrl from "./controllers/get-earned-value";
import getPayItemsCtrl from "./controllers/get-pay-items";
import {
  deleteProduction,
  getProduction,
  recordProduction,
} from "./controllers/record-production";
import {
  createPayItem,
  deletePayItem,
  updatePayItem,
} from "./controllers/upsert-pay-item";

const optionalText = v.optional(v.nullable(v.string()));

/**
 * Pay items are the project's estimate expressed in construction units; production
 * entries are the same list filled in as work gets done. Earned value is the comparison.
 */
const payItem = new Hono<{
  Variables: { userId: string; workspaceId: string };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listPayItems",
      tags: ["Pay items"],
      description:
        "List a project's pay items with installed-to-date quantities",
      responses: {
        200: {
          description: "Pay items",
          content: {
            "application/json": { schema: resolver(v.array(payItemSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getPayItemsCtrl(projectId));
    },
  )
  .get(
    "/:projectId/earned-value",
    describeRoute({
      operationId: "getEarnedValue",
      tags: ["Pay items"],
      description:
        "Earned value per pay item and in total: budget vs earned revenue, budget vs earned vs actual hours, and the resulting productivity factor",
      responses: {
        200: {
          description: "Earned value rollup",
          content: {
            "application/json": { schema: resolver(earnedValueSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getEarnedValueCtrl(projectId));
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createPayItem",
      tags: ["Pay items"],
      description:
        "Add a pay item. Price and standard hours default from the catalog entry for the chosen action and are snapshotted, so repricing the catalog later doesn't restate bid work.",
      responses: {
        200: {
          description: "Pay item created",
          content: { "application/json": { schema: resolver(payItemSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        constructionUnitId: v.string(),
        gridAssetId: optionalText,
        action: v.optional(v.picklist(PAY_ITEM_ACTIONS)),
        estimatedQuantity: v.optional(v.string()),
        unitPrice: optionalText,
        standardHours: optionalText,
        notes: optionalText,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const created = await createPayItem(
        projectId,
        workspaceId,
        c.req.valid("json"),
      );
      return c.json(created);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updatePayItem",
      tags: ["Pay items"],
      description: "Update a pay item's quantity, price, or standard hours",
      responses: {
        200: {
          description: "Pay item updated",
          content: { "application/json": { schema: resolver(payItemSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({
        gridAssetId: optionalText,
        action: v.optional(v.picklist(PAY_ITEM_ACTIONS)),
        estimatedQuantity: v.optional(v.string()),
        unitPrice: optionalText,
        standardHours: optionalText,
        notes: optionalText,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const updated = await updatePayItem(id, projectId, c.req.valid("json"));
      return c.json(updated);
    },
  )
  .delete(
    "/:projectId/:id",
    describeRoute({
      operationId: "deletePayItem",
      tags: ["Pay items"],
      description:
        "Delete a pay item. Production booked against it is removed too, since there is nothing left to value it against.",
      responses: {
        200: {
          description: "Pay item deleted",
          content: { "application/json": { schema: resolver(payItemSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deletePayItem(id, projectId));
    },
  )
  .get(
    "/:projectId/production",
    describeRoute({
      operationId: "listProduction",
      tags: ["Pay items"],
      description: "Production history for a project, most recent first",
      responses: {
        200: {
          description: "Production entries",
          content: {
            "application/json": {
              schema: resolver(v.array(productionEntrySchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      return c.json(await getProduction(projectId));
    },
  )
  .post(
    "/:projectId/production",
    describeRoute({
      operationId: "recordProduction",
      tags: ["Pay items"],
      description: "Book a quantity installed against a pay item",
      responses: {
        200: {
          description: "Production recorded",
          content: {
            "application/json": { schema: resolver(productionEntrySchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        payItemId: v.string(),
        quantity: v.string(),
        entryDate: v.string(),
        crewId: optionalText,
        dailyReportId: optionalText,
        notes: optionalText,
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { entryDate, ...rest } = c.req.valid("json");
      const created = await recordProduction({
        projectId,
        ...rest,
        entryDate: new Date(entryDate),
        enteredByUserId: c.get("userId"),
      });
      return c.json(created);
    },
  )
  .delete(
    "/:projectId/production/:id",
    describeRoute({
      operationId: "deleteProduction",
      tags: ["Pay items"],
      description: "Remove a production entry",
      responses: {
        200: {
          description: "Production entry deleted",
          content: {
            "application/json": { schema: resolver(productionEntrySchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      return c.json(await deleteProduction(id, projectId));
    },
  );

export default payItem;
