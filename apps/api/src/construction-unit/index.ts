import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { constructionUnitSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getConstructionUnitsCtrl from "./controllers/get-construction-units";
import importConstructionUnitsCtrl from "./controllers/import-construction-units";
import {
  createConstructionUnit,
  updateConstructionUnit,
} from "./controllers/upsert-construction-unit";
import { UNITS_OF_MEASURE } from "./unit-types";

const optionalText = v.optional(v.nullable(v.string()));

const unitBody = {
  unitOfMeasure: v.optional(v.picklist(UNITS_OF_MEASURE)),
  discipline: optionalText,
  installHours: optionalText,
  removeHours: optionalText,
  transferHours: optionalText,
  installPrice: optionalText,
  removePrice: optionalText,
  transferPrice: optionalText,
  isActive: v.optional(v.boolean()),
};

/**
 * The CU catalog is workspace-level: one utility's codes serve all its projects. There is
 * no seeded catalog because every utility publishes its own codes -- it arrives by CSV.
 */
const constructionUnit = new Hono<{
  Variables: { userId: string; workspaceId: string };
}>()
  .get(
    "/:workspaceId",
    describeRoute({
      operationId: "listConstructionUnits",
      tags: ["Construction units"],
      description: "List the workspace construction-unit catalog, by code",
      responses: {
        200: {
          description: "Construction units",
          content: {
            "application/json": {
              schema: resolver(v.array(constructionUnitSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    validator("query", v.object({ includeInactive: v.optional(v.string()) })),
    workspaceAccess.fromParam("workspaceId"),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const { includeInactive } = c.req.valid("query");
      return c.json(
        await getConstructionUnitsCtrl(workspaceId, includeInactive === "true"),
      );
    },
  )
  .post(
    "/:workspaceId",
    describeRoute({
      operationId: "createConstructionUnit",
      tags: ["Construction units"],
      description: "Add a construction unit to the catalog",
      responses: {
        200: {
          description: "Construction unit created",
          content: {
            "application/json": { schema: resolver(constructionUnitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    validator(
      "json",
      v.object({
        code: v.pipe(v.string(), v.minLength(1)),
        description: v.pipe(v.string(), v.minLength(1)),
        ...unitBody,
      }),
    ),
    workspaceAccess.fromParam("workspaceId"),
    requireWorkspacePermission({ workspace: ["manage_settings"] }),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const created = await createConstructionUnit(
        workspaceId,
        c.req.valid("json"),
      );
      return c.json(created);
    },
  )
  .post(
    "/:workspaceId/import",
    describeRoute({
      operationId: "importConstructionUnits",
      tags: ["Construction units"],
      description:
        "Bulk-load a CU catalog from a utility rate sheet. Matches on code, so re-importing a revised sheet updates prices in place. Existing pay items keep the price they were bid at.",
      responses: {
        200: {
          description: "Counts of created and updated units, plus skipped rows",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  created: v.number(),
                  updated: v.number(),
                  skipped: v.array(
                    v.object({ code: v.string(), reason: v.string() }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    validator(
      "json",
      v.object({
        units: v.array(
          v.object({
            code: v.string(),
            description: v.optional(v.string()),
            unitOfMeasure: v.optional(v.string()),
            discipline: v.optional(v.string()),
            installHours: v.optional(v.string()),
            removeHours: v.optional(v.string()),
            transferHours: v.optional(v.string()),
            installPrice: v.optional(v.string()),
            removePrice: v.optional(v.string()),
            transferPrice: v.optional(v.string()),
          }),
        ),
      }),
    ),
    workspaceAccess.fromParam("workspaceId"),
    requireWorkspacePermission({ workspace: ["manage_settings"] }),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const { units } = c.req.valid("json");
      return c.json(await importConstructionUnitsCtrl(workspaceId, units));
    },
  )
  .put(
    "/:workspaceId/:id",
    describeRoute({
      operationId: "updateConstructionUnit",
      tags: ["Construction units"],
      description: "Update a construction unit's description, rates, or prices",
      responses: {
        200: {
          description: "Construction unit updated",
          content: {
            "application/json": { schema: resolver(constructionUnitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({
        code: v.optional(v.string()),
        description: v.optional(v.string()),
        ...unitBody,
      }),
    ),
    workspaceAccess.fromParam("workspaceId"),
    requireWorkspacePermission({ workspace: ["manage_settings"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const updated = await updateConstructionUnit(
        id,
        workspaceId,
        c.req.valid("json"),
      );
      return c.json(updated);
    },
  );

export default constructionUnit;
