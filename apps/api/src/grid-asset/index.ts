import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { gridAssetSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { CIRCUIT_TYPES, GRID_ASSET_TYPES } from "./asset-types";
import createGridAssetCtrl from "./controllers/create-grid-asset";
import deleteGridAssetCtrl from "./controllers/delete-grid-asset";
import getGridAssetsCtrl from "./controllers/get-grid-assets";
import importGridAssetsCtrl from "./controllers/import-grid-assets";
import updateGridAssetCtrl from "./controllers/update-grid-asset";

const optionalText = v.optional(v.nullable(v.string()));

const assetBody = {
  designation: v.pipe(v.string(), v.minLength(1)),
  assetType: v.optional(v.picklist(GRID_ASSET_TYPES)),
  circuitId: optionalText,
  parentGridAssetId: optionalText,
  description: optionalText,
  sequence: v.optional(v.nullable(v.number())),
  latitude: optionalText,
  longitude: optionalText,
  stationing: optionalText,
  voltageKv: optionalText,
  attributes: v.optional(v.nullable(v.record(v.string(), v.unknown()))),
};

/**
 * Grid assets are the work-breakdown spine, so every route is project-scoped. That also
 * lets workspaceAccess resolve the workspace from the project in the path.
 */
/**
 * Permissions track tasks, not project settings. The register is the work-breakdown that
 * tasks hang off, so anyone who can create and update tasks can maintain it. Deletion is
 * gated harder because it unlinks existing work.
 */
const gridAsset = new Hono<{
  Variables: {
    userId: string;
    workspaceId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listGridAssets",
      tags: ["Grid assets"],
      description:
        "List the structure register for a project, with task rollups per asset",
      responses: {
        200: {
          description: "Grid assets ordered by sequence then designation",
          content: {
            "application/json": { schema: resolver(v.array(gridAssetSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "query",
      v.object({
        assetType: v.optional(v.picklist(GRID_ASSET_TYPES)),
        circuitId: v.optional(v.string()),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { assetType, circuitId } = c.req.valid("query");
      const assets = await getGridAssetsCtrl(projectId, {
        assetType,
        circuitId,
      });
      return c.json(assets);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createGridAsset",
      tags: ["Grid assets"],
      description: "Add a structure, span, bay, or piece of equipment",
      responses: {
        200: {
          description: "Asset created",
          content: {
            "application/json": { schema: resolver(gridAssetSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator("json", v.object(assetBody)),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const body = c.req.valid("json");
      const created = await createGridAssetCtrl({
        projectId,
        ...body,
        assetType: body.assetType ?? "structure",
      });
      return c.json(created);
    },
  )
  .post(
    "/:projectId/import",
    describeRoute({
      operationId: "importGridAssets",
      tags: ["Grid assets"],
      description:
        "Bulk-load a structure list. Matches on designation, so re-importing a corrected list updates in place. Circuits are created on demand.",
      responses: {
        200: {
          description:
            "Counts of created and updated assets, plus skipped rows",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  created: v.number(),
                  updated: v.number(),
                  skipped: v.array(
                    v.object({ designation: v.string(), reason: v.string() }),
                  ),
                }),
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        assets: v.array(
          v.object({
            designation: v.string(),
            assetType: v.optional(v.string()),
            circuitDesignation: v.optional(v.string()),
            description: v.optional(v.string()),
            sequence: v.optional(v.number()),
            latitude: v.optional(v.string()),
            longitude: v.optional(v.string()),
            stationing: v.optional(v.string()),
            voltageKv: v.optional(v.string()),
          }),
        ),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { assets } = c.req.valid("json");
      const result = await importGridAssetsCtrl(projectId, assets);
      return c.json(result);
    },
  )
  .put(
    "/:projectId/:id",
    describeRoute({
      operationId: "updateGridAsset",
      tags: ["Grid assets"],
      description: "Update a grid asset",
      responses: {
        200: {
          description: "Asset updated",
          content: {
            "application/json": { schema: resolver(gridAssetSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    validator(
      "json",
      v.object({ ...assetBody, designation: v.optional(v.string()) }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const updated = await updateGridAssetCtrl({
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
      operationId: "deleteGridAsset",
      tags: ["Grid assets"],
      description:
        "Delete a grid asset. Its tasks and child assets survive, unlinked.",
      responses: {
        200: {
          description: "Asset deleted",
          content: {
            "application/json": { schema: resolver(gridAssetSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string(), id: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      const deleted = await deleteGridAssetCtrl(id, projectId);
      return c.json(deleted);
    },
  );

export { CIRCUIT_TYPES, GRID_ASSET_TYPES };
export default gridAsset;
