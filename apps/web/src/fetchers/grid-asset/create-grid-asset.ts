import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateGridAssetRequest = InferRequestType<
  (typeof client)["grid-asset"][":projectId"]["$post"]
>["json"] & { projectId: string };

async function createGridAsset({
  projectId,
  ...asset
}: CreateGridAssetRequest) {
  const response = await client["grid-asset"][":projectId"].$post({
    param: { projectId },
    json: asset,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default createGridAsset;
